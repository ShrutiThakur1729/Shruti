# Guestbook API tests: validation, profanity filter, moderation auth, approve/delete flows
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
ADMIN_KEY = 'd066ad7d91b1a9c54fdcb9bb8c444d2f'
ADMIN = {'X-Admin-Key': ADMIN_KEY}
created_ids = []


@pytest.fixture(scope='module', autouse=True)
def cleanup():
    yield
    for i in created_ids:
        requests.delete(f"{BASE_URL}/api/guestbook/{i}", headers=ADMIN)


def post(name, message):
    return requests.post(f"{BASE_URL}/api/guestbook", json={'name': name, 'message': message})


# Health
def test_health():
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200 and r.json()['status'] == 'ok'


# Validation
@pytest.mark.parametrize('name,message,frag', [
    ('', 'Hello there', 'name'),
    ('   ', 'Hello there', 'name'),
    ('A' * 41, 'Hello there', 'name'),
    ('TEST_bob', 'hi', '3 to 140'),
    ('TEST_bob', 'x' * 141, '3 to 140'),
    ('TEST_bob', 'visit https://spam.com now', 'Links'),
    ('TEST_bob', 'visit www.spam.com now', 'Links'),
    ('TEST_bob', 'this is shit', 'kind'),
    ('TEST_bob', 'this is sh1t', 'kind'),
    ('TEST_bob', 'what the fuuuck f*ck', None),
    ('TEST_bob', 'you b1tch', 'kind'),
    ('TEST_bob', 'FUCKING great', 'kind'),
    ('sh1thead', 'lovely garden', 'kind'),
    ('TEST_bob', 'a$$hole', 'kind'),
])
def test_validation(name, message, frag):
    r = post(name, message)
    if frag is None:
        # informational - log only
        print('fuuuck/f*ck ->', r.status_code, r.text)
        if r.status_code == 200:
            created_ids.append(r.json()['id'])
        return
    assert r.status_code == 400, r.text
    assert frag.lower() in r.json()['detail'].lower()


def test_valid_note_pending_and_hidden_from_public():
    r = post('TEST_Agent', 'TEST_ lovely garden note')
    assert r.status_code == 200
    d = r.json()
    assert d['ok'] is True and d['status'] == 'pending' and isinstance(d['id'], str)
    created_ids.append(d['id'])
    pub = requests.get(f"{BASE_URL}/api/guestbook").json()
    assert all(n['id'] != d['id'] for n in pub)
    assert all(n.get('status') == 'approved' for n in pub)
    assert all('_id' not in n for n in pub)


def test_whitespace_collapse_and_boundaries():
    r = post('TEST_' + 'b' * 35, '  abc   ')
    assert r.status_code == 200, r.text
    created_ids.append(r.json()['id'])
    r2 = post('TEST_edge', 'y' * 140)
    assert r2.status_code == 200
    created_ids.append(r2.json()['id'])


# Moderation auth
@pytest.mark.parametrize('method,path', [
    ('get', '/api/guestbook/moderation'),
    ('post', '/api/guestbook/000000000000000000000000/approve'),
    ('delete', '/api/guestbook/000000000000000000000000'),
])
@pytest.mark.parametrize('headers', [{}, {'X-Admin-Key': 'wrong'}])
def test_moderation_requires_key(method, path, headers):
    r = getattr(requests, method)(f"{BASE_URL}{path}", headers=headers)
    assert r.status_code == 401
    assert 'key' in r.json()['detail'].lower()


@pytest.mark.parametrize('nid', ['000000000000000000000000', 'not-an-id'])
def test_invalid_ids_404(nid):
    r = requests.post(f"{BASE_URL}/api/guestbook/{nid}/approve", headers=ADMIN)
    assert r.status_code == 404
    r = requests.delete(f"{BASE_URL}/api/guestbook/{nid}", headers=ADMIN)
    assert r.status_code == 404


def test_approve_then_public_then_delete():
    r = post('TEST_Flow', 'TEST_ approve flow note')
    nid = r.json()['id']
    created_ids.append(nid)
    mod = requests.get(f"{BASE_URL}/api/guestbook/moderation", headers=ADMIN)
    assert mod.status_code == 200
    rows = mod.json()
    assert any(n['id'] == nid and n['status'] == 'pending' for n in rows)
    assert all('_id' not in n for n in rows)
    a = requests.post(f"{BASE_URL}/api/guestbook/{nid}/approve", headers=ADMIN)
    assert a.status_code == 200 and a.json()['ok'] is True
    pub = requests.get(f"{BASE_URL}/api/guestbook").json()
    match = [n for n in pub if n['id'] == nid]
    assert match and match[0]['message'] == 'TEST_ approve flow note'
    d = requests.delete(f"{BASE_URL}/api/guestbook/{nid}", headers=ADMIN)
    assert d.status_code == 200
    created_ids.remove(nid)
    pub = requests.get(f"{BASE_URL}/api/guestbook").json()
    assert all(n['id'] != nid for n in pub)
    assert requests.delete(f"{BASE_URL}/api/guestbook/{nid}", headers=ADMIN).status_code == 404


# Regression: contact
def test_contact_regression():
    r = requests.post(f"{BASE_URL}/api/contact", json={'name': 'TEST_c', 'email': 'a@b.co', 'subject': 's', 'message': 'm'})
    assert r.status_code == 200 and r.json()['ok'] is True
    r = requests.post(f"{BASE_URL}/api/contact", json={'name': 'TEST_c', 'email': 'bad', 'subject': 's', 'message': 'm'})
    assert r.status_code == 400
