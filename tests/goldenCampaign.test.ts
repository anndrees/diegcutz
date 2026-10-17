import {it,expect} from 'bun:test';
import {readFileSync} from 'node:fs';
it('keeps the approved seven release days and 28 deductions configured on the server',()=>{
 const sql=readFileSync('supabase/migrations/20261017143909_e03e98ab-6ca7-4e6d-bc5b-7442a71e7380.sql','utf8');
 expect(sql).toContain('array[0,3,6,9,12,15,20]');expect(sql).toContain('cardinality(prog.solved)=28');
});
it('keeps draft PIN separate from server administrator authorization',()=>{
 const sql=readFileSync('supabase/migrations/20261017143909_e03e98ab-6ca7-4e6d-bc5b-7442a71e7380.sql','utf8');
 expect(sql).toContain("payload->>'pin'='0529'");expect(sql).toContain("isadmin:=public.has_role(uid,'admin')");expect(sql).toContain('if not isadmin then');
});
it('requires shop attendance from chapter three and consumes each card only once',()=>{
 const sql=readFileSync('supabase/migrations/20261017143909_e03e98ab-6ca7-4e6d-bc5b-7442a71e7380.sql','utf8');
 expect(sql).toContain('chapter_id>=3 and prog.visited_at is null');expect(sql).toContain('card.consumed_at is not null');expect(sql).toContain('where code_hash=md5(code) for update');
});