# db-lens README

VS Code extension for managing and connecting to databases through SSH tunnels using AWS IAM authentication.

## Motivation

There was no simple solution for managing database connections that require both SSH tunneling and AWS IAM authentication directly within VS Code. As a developer facing this issue daily, I saw it as the perfect opportunity to dive into extension development and build the tool I was missing myself.

## Secure Database Connections: SSH Tunnel + AWS RDS IAM Authentication

This extension enables secure connections to AWS RDS databases by combining SSH tunneling with AWS IAM authentication tokens. This approach is useful when your RDS instance is not publicly accessible and you want to leverage IAM for passwordless, temporary authentication.

**How it works:**

-   The extension establishes an SSH tunnel to a bastion (jump) host within your VPC.
-   It then generates a temporary AWS RDS IAM authentication token for your database user.
-   The database connection is made through the SSH tunnel using the IAM token as the password.

## Features

-   Secure database connections using SSH tunneling.
-   Passwordless authentication with AWS RDS IAM.
-   Manage and save multiple connection profiles.

## Requirements

-   for AWS
    -   AWS CLI installed and configured
    -   IAM user with permissions to generate RDS authentication tokens

## Extension Settings

This extension contributes the following settings:

-   `db-lens.baseDir`: The base directory for DB Lens.

## Known Issues

## Future Improvements

-   Windows support
-   NoSQL database support
-   Other cloud providers
