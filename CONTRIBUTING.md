# Contributing to SuperTokens

Contributions are always welcome. Before contributing please read the [code of conduct](https://github.com/supertokens/supertokens-website/blob/master/CODE_OF_CONDUCT.md) & search [the issue tracker](https://github.com/supertokens/supertokens-website/issues); your issue may have already been discussed or fixed in master. To contribute, fork SuperTokens, commit your changes, & send a pull request.

# Questions
We are most accessible via team@supertokens.io, via the GitHub issues feature and our [Discord server](https://discord.gg/zVcVeev). 

## Pull Requests
Before issuing a pull request, please make sure:
- There are no Typescript compilation issues - we have a pre-commit hook to enforce this
- Code is formatted properly - we have a pre-commit hook to enforce this
- All tests are passing. We will also be running tests when you issue a pull request.

Please only issue pull requests to the dev branch.


## Prerequisites

1) You will need NodeJS and MySQL on your local system to run and test the repo.

2) Install node dependencies
    ```bash
    npm install -d
    ```

3) Set-up hooks
    ```bash
    npm run set-up-hooks
    ```

## Coding standards
In addition to the following guidelines, please follow the conventions already established in the code.

- **Naming**
    - Use camel case for all variable names: ```aNewVariable```
    - Use underscores for sql table names and column names: ```new_sql_table```
    - Use camel case name for new files: ```helloWorld.ts```
    - For classes, use camel case, starting with a capital letter: ```MyClass```
    - For constants, use all caps with underscores: ```A_CONSTANT```

- **Comments**
    - Please refrain from commenting very obvious code. But for anything else, please do add comments.
    - For every function, please write what it returns, if it throws an error (and what type), as well as what the params mean (if they are not obvious).

- **Error handling**
    - Please only stick to throwing AuthErrors to the client of this repo.

All other issues like quote styles, spacing etc.. will be taken care of by the formatter.


## Pre committing checks

1) Run the build pretty script
    ```bash
    npm run build-pretty
    ```

2) If you have edited ```/index.ts``` or ```/indexRaw.ts```, please make the corresponding changes to ```/index.js``` or ```indexRaw.js```. In the ```.js``` files, be sure to change any ```import/export``` statements to use ```/lib/build/``` and not ```/lib/ts``` 


## Pre push

Run unit tests and make sure all tests are passing.
```bash
npm test
```
You can change the following MySQL params while testing:
```bash
host: process.env.MYSQL_HOST, # default is localhost
port: process.env.MYSQL_PORT, # default is 3306
user: process.env.MYSQL_USER, # default is "root"
password: process.env.MYSQL_PASSWORD, # default is "root"
database: process.env.MYSQL_DB # default is "auth_session"

# For example
MYSQL_HOST=somehost MYSQL_PORT=9999 npm test
```
If you have docker, we have a container that has node, mysql and git installed in it
````bash
docker pull rishabhpoddar/node-mysql-git

# open a shell in the container, checkout your repo and run:
(cd / && ./runMySQL.sh)
mysql -u root --password=root -e "CREATE DATABASE auth_session;"
npm install -d
npm test
````