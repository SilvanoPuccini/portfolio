import json, os, subprocess, sys, time
host=sys.argv[1]
base=['psql','-X','-v','ON_ERROR_STOP=1','-h',host,'-p','55433','-d','postgres','-Atc']
def run(sql):
    return subprocess.run(base+[sql],capture_output=True,text=True,check=True).stdout.strip()
def call(order,email):
    details=json.dumps({'nombre':'Test','email':email})
    return "select prepare_order_contract('00000000-0000-0000-0000-%012d','%s',true);" % (order, details)
def pair(order,second_email):
    first=subprocess.Popen(base+['begin;'+call(order,'same@example.test')+" select pg_sleep(1); commit;"],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    time.sleep(.2)
    second=subprocess.Popen(base+[call(order,second_email)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    out1,err1=first.communicate(timeout=15); out2,err2=second.communicate(timeout=15)
    assert first.returncode==0,err1
    if second_email=='same@example.test':
        assert second.returncode==0,err2
        replies=[json.loads(line) for line in (out1+'\n'+out2).splitlines() if line.startswith('{')]
        assert len(replies)==2 and replies[0]['id']==replies[1]['id']
        assert sum(r['created'] for r in replies)==1
        assert sum(r['provision'] for r in replies)==1
    else:
        assert second.returncode!=0 and 'buyer_conflict' in err2,(out2,err2)
    assert run("select count(*) from leads where id=(select lead_id from pedidos where id='00000000-0000-0000-0000-%012d');" % order)=='1'
pair(2,'same@example.test')
pair(3,'different@example.test')
assert run('select count(*) from leads;')=='3'
print('Concurrent same/different buyer assertions passed')
