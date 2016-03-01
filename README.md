# auth-service
A simple authentication service written in Node.js utilising a postgreSQL database

### Command line arguments
There following command line arguments are supported:
>--connection-params [required]

>--ttl [optional]

#### Example
`--ttl 900 --connection-params postgres://username:password@yourpostgresqlserver.com:5432/databasename`

### Database
The default setup is using a postgreSQL database.

## SSL
The service is set up to use SSL, and will look for the certificate and private key file at the following locations:
`/ssl/server.key`, `/ssl/server.crt`

## Endpoints
##### GET /

>Returns a JSON object of the instance.

>>`{
uptime: 239857.63045705901
}`

##### POST /login
Requires headers:
`username`,
`password`

>Returns a JSON object containing whether or not the login attempt was successful, and the authorization token.


>>On success: `{"success":true,"token":"09775472-f235-4bfe-bd73-ccc0ad0ee21a"}`

>>On failure: `{"success":false}`

##### POST /validate
Requires headers:
`token`

> Returns a JSON object containing whether or not the validation attempt was successful, and the corresponding user-id.


>> On success: `{"success":true,"userId":1337}`

>> On failure: `{"success":false}`
