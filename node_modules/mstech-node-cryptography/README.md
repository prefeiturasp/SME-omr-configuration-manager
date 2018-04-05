# NodeJS Cryptography

## Usage

### Install
 ```
    npm install node-cryptography --save
 ```

### Encrypt
    var Cryptography = require('node-cryptography');
    var encrypted = Cryptography.encrypt('My Input Text');

### Decrypt
    var Cryptography = require('node-cryptography');
    var decrypted = Cryptography.decrypt('My Encrypted Text');
