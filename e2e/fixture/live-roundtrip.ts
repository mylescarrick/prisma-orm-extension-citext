/**
 * Proves citext columns behave case-insensitively through every query path, on a real database.
 *
 * Expects an empty, migrated database created with LC_COLLATE 'C', so plain text would sort and
 * compare case-sensitively and only citext's own case folding can make these checks pass.
 */
import 'dotenv/config';
import assert from 'node:assert/strict';
import { db } from './src/prisma/db.ts';

const User = db.orm.public.User;
const Post = db.orm.public.Post;
let failures = 0;

async function check(name: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
    console.log(`ok   ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL ${name}\n     ${error instanceof Error ? error.message : String(error)}`);
  }
}

try {
  await User.create({ email: 'Alice@Example.com' });
  await User.create({ email: 'bob@example.com', name: 'Bob' });
  await User.create({ email: 'Carol@example.com', name: 'carol' });

  await check('string @default lands as written', async () => {
    const alice = await User.where({ email: 'Alice@Example.com' }).first();
    assert.equal(alice?.name, 'anonymous');
  });

  await check('object equality ignores case and returns the stored spelling', async () => {
    const alice = await User.where({ email: 'ALICE@EXAMPLE.COM' }).first();
    assert.equal(alice?.email, 'Alice@Example.com');
  });

  await check('.eq ignores case', async () => {
    const rows = await User.where((u) => u.email.eq('aLiCe@eXaMpLe.CoM')).all();
    assert.equal(rows.length, 1);
  });

  await check('.neq ignores case', async () => {
    const rows = await User.where((u) => u.email.neq('ALICE@example.com')).all();
    assert.deepEqual(rows.map((r) => r.email).toSorted(), ['Carol@example.com', 'bob@example.com']);
  });

  await check('.in ignores case', async () => {
    const rows = await User.where((u) =>
      u.email.in(['BOB@EXAMPLE.COM', 'carol@EXAMPLE.com']),
    ).all();
    assert.equal(rows.length, 2);
  });

  await check('.like ignores case (citext LIKE)', async () => {
    const rows = await User.where((u) => u.email.like('ALICE%')).all();
    assert.equal(rows.length, 1);
  });

  await check('.ilike works', async () => {
    const rows = await User.where((u) => u.email.ilike('%EXAMPLE.COM')).all();
    assert.equal(rows.length, 3);
  });

  await check('@unique rejects a case-variant duplicate', async () => {
    await assert.rejects(User.create({ email: 'ALICE@EXAMPLE.COM' }));
  });

  await check('orderBy sorts case-insensitively under C collation', async () => {
    const rows = await User.orderBy((u) => u.name.asc()).all();
    assert.deepEqual(
      rows.map((r) => r.name),
      ['anonymous', 'Bob', 'carol'],
    );
  });

  await check('update by a case-variant key', async () => {
    await User.where({ email: 'BOB@EXAMPLE.COM' }).update({ name: 'Robert' });
    const bob = await User.where({ email: 'bob@example.com' }).first();
    assert.equal(bob?.name, 'Robert');
  });

  await check('foreign key accepts a case-variant reference', async () => {
    await Post.create({ title: 'first', authorEmail: 'ALICE@EXAMPLE.COM' });
    await Post.create({ title: 'second', authorEmail: 'alice@example.com' });
  });

  await check('include joins across case variants (Prisma 7 bug #14935)', async () => {
    const alice = await User.where({ email: 'Alice@Example.com' }).include('posts').first();
    assert.deepEqual(alice?.posts.map((p) => p.title).toSorted(), ['first', 'second']);
  });

  await check('to-one include from the child side', async () => {
    const post = await Post.where({ title: 'first' }).include('author').first();
    assert.equal(post?.author?.email, 'Alice@Example.com');
  });

  await check('distinctOn collapses case variants (Prisma 7 bug #22342)', async () => {
    const all = await Post.all();
    assert.deepEqual(all.map((p) => p.authorEmail).toSorted(), [
      'ALICE@EXAMPLE.COM',
      'alice@example.com',
    ]);
    const rows = await Post.orderBy((p) => p.authorEmail.asc())
      .distinctOn('authorEmail')
      .all();
    assert.equal(rows.length, 1);
  });

  await check('SQL builder fns.eq ignores case', async () => {
    const plan = db.sql.public.User.select('email')
      .where((f, fns) => fns.eq(f.email, 'CAROL@EXAMPLE.COM'))
      .build();
    const rows = await db.runtime().query(plan);
    assert.deepEqual(
      rows.map((r) => r.email),
      ['Carol@example.com'],
    );
  });

  await check('delete by a case-variant key', async () => {
    await User.where({ email: 'CAROL@example.COM' }).delete();
    assert.equal(await User.where({ email: 'Carol@example.com' }).first(), null);
  });
} finally {
  await db.close();
}

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`);
process.exitCode = failures === 0 ? 0 : 1;
