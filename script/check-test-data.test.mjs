import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

for (const [path, content] of [
  ['.local-data/fixture.json', '{"synthetic":true}'],
  ['database-backup.sql.gz', 'synthetic backup'],
  ['exports/synthetic-users.csv', 'account\nsynthetic_probe\n'],
  ['sql_script/guard-probe.sql', 'INSERT INTO identity (account) VALUES (\'synthetic_probe\');'],
]) {
  test(`rejects ${path} staged through an isolated index`, () => {
    const directory = mkdtempSync(join(tmpdir(), 'cdmga-index-'))
    const env = { ...process.env, GIT_INDEX_FILE: join(directory, 'index') }
    try {
      execFileSync('git', ['read-tree', 'HEAD'], { env })
      const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], { input: content, encoding: 'utf8' }).trim()
      execFileSync('git', ['update-index', '--add', '--cacheinfo', `100644,${blob},${path}`], { env })
      const result = spawnSync(process.execPath, ['script/check-test-data.mjs'], { env, encoding: 'utf8' })
      assert.equal(result.status, 1)
      assert.ok(result.stderr.includes(path))
      assert.ok(!result.stderr.includes(content))
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
}
