# Identity and Access Management - IAM

Contains the implementation of the
[essential-projects IAM contracts](https://github.com/essential-projects/iam_contracts)
interfaces.

## Purpose

The ProcessEngine will use the IAM for authorization only. The contracts
found in `essential-projects/iam_contracts` will provide a template for this.

Two things are implemented:

1. The IAM Service

   Used for interaction with the authority. Provides a method to check if an
   identity can be associated with the necessary claims.

2. The Identity Service

   A service that knows how to transform a given token (e.g. JWT) to an
   identity that the authority can understand.

**Usage Example:**

The easiest way to get familiar with the ideas is to look at an example; this
will illustrate the use of and the interaction between an IAM service and the
identity service:

```ts
// Create the two services; will be implemented here in this repository.
const identityService: IIdentityService = new IdentityService();
const iamService: IIAMService = new IAMService(new HttpClient(), identityService, this.config.introspectPath);

// Get the identity for a given JWT token.
const token: String = "Place JWT Token here";
const identity: IIdentity = identityService.getIdentity(token);

// Will result in:
//
// 1. An UnauthorizedError HTTP Status code, if the identity is not logged in at the authority.
// 2. An ForbiddenError HTTP Status code, if the identity does not have the claim.
// 3. Nothing, if the claim and identity matches.
iamService.ensureHasClaim(identity, 'allowd_to_read_data');

// Place protected code here.
(...)
```

## Usage of the IAM

At its core, the IAM implementation is simple; by using the IAM service's
`ensureHasClaim()` method you will either:

1. Get an Forbidden Error

   A 403 will be the most common case for this; it resembles simply, that the
   identity and the required claim have no association.

1. Get an Unauthorized Error

   A 401 will be emitted, if the identity is not known to the authority or the
   token is invalid/expired/etc.

2. Get Nothing, if the claim and identity match.

   A 204, which resembles a happy path; if you get to the code behind
   `iamService.ensureHasClaim()`, you have clearance to perform the
   desired operations.

## Configuration

The IAM service needs some minor configurations; it needs to know:

1. Its authority.
1. The client secret.
