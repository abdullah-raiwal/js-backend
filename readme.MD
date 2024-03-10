
# JS Backend (Youtube)

complete express js backend api project that mainly inherits the working of youtube backend in following manner:



## Features

- Video uploading with like and comment.
- playlist function with adding videos to it
- tweet functionality
- user can subscribe/unsubscribe to channels.



## Installation

Install my-project with npm

```bash
  cd <project-directory>
  npm install
```

after packages are installed. create new file called 
.env and copy paste env variables from .env.sample to .env and populate them respectively. make sure to create .env as same level as .env.sample. after that run this commad
```bash
 npm run dev
```
    
## Requirements
# Project Requirements

This project requires several external services to be configured. Below are the requirements for each service:

## MongoDB
- **Requirement**: MongoDB is used as the database for storing application data.
- **Configuration**:
  - Set up a MongoDB database instance. You can use either a local MongoDB server or a cloud-based MongoDB service like MongoDB Atlas.
  - Obtain the connection URL for your MongoDB database. This URL typically includes the hostname, port, database name, and optional authentication credentials.

## Cloudinary
- **Requirement**: Cloudinary is used for storing and managing media files such as images and videos.
- **Configuration**:
  - Create a Cloudinary account if you haven't already.
  - Obtain your Cloudinary account credentials:
    - Cloud name
    - API key
    - API secret

## Authentication Tokens
- **Requirement**: The application uses JWT (JSON Web Tokens) for authentication.
- **Configuration**:
  - Generate unique secret keys for both access and refresh tokens.
  - Define the expiry duration for both access and refresh tokens.

## Email Configuration
- **Requirement**: The application may require sending emails for various purposes such as user registration, password reset, etc.
- **Configuration**:
  - Provide SMTP server details for sending emails, including:
    - Hostname
    - Port
    - User credentials (username and password)
    - Sender email address

## CORS (Cross-Origin Resource Sharing)
- **Requirement**: CORS is configured to allow cross-origin requests from specified origins.
- **Configuration**:
  - Define the list of allowed origins from which the frontend can make requests. This can include specific domains or `*` to allow requests from any origin.

## Base URL
- **Requirement**: The base URL of the application.
- **Configuration**:
  - Specify the base URL where the application is hosted. This can be useful for generating absolute URLs in the application.