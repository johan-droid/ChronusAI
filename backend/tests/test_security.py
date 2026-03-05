from app.core.security import token_encryptor


def test_token_encryptor_roundtrip():
    token = "secret-token"
    encrypted = token_encryptor.encrypt(token)
    assert token not in encrypted
    assert token_encryptor.decrypt(encrypted) == token

