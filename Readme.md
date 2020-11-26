# Multi-tenant integration example with use of Auth0

This repo contains a simple webapp that displays Cumul.io dashboards with multi-tenancy which is presented as a live coding session at Data Talks 2020. Starting with an initial 'skeleton' commit that contains code for logins and the overall structure of the app, each following commit represents steps to achieve the following:

1. Get a dynamic list of dashboards from Cumul.io based on a tag
2. Embed a dashboard in your frontend using the Cumul.io Integration API
3. Add authorization request to securily embed the dashboard
4. Add parameters to filter the data in the embedded dashboards to the user's context
5. Add viewer metadata to the authorization request for audit purposes


Follow the steps below to setup your own instance of this multitenant demo app. Setting this app will allow you to define rules that determine what each user has access to on your dashboard.

Before you begin, you will need a cumul.io account. 
  
## I. Create a dashboard

  
Here we will use the "United Widgets Sales dataset". First, you will have to create a new dashboard. Then you can find the dataset in DATA -> Add new dataset (+) -> Demo Data. Here select "United Widgets Sales dataset" and Import.

Create for example a dashboard with a parameter `department` of type `Hierarchy[]` and use it in a dashboard filter on "United Widgets Sales dataset" for the column "Product Name".

Go to your dashboards overview, click on "More info" on the dashboard you just created and add the tag "auth0", the app will automatically pick up all dashboards with this tag.

## II. Auth0 setup

1. Create a file called auth_config.json in the root directory with the following structure:

```
{
  "domain": "xxxx",
  "clientId": "xxxx",
  "audience":  "xxxx"
}
```

2. Create an account [here](https://auth0.com/) 

3. In the Applications menu create a new Application and select Single Page Web Applications and in Settings:

    * copy 'Domain' & 'Client ID' to the same attributes in the auth_config.json file

    * set the parameters of:
        
        > Allowed Callback URLs: `http://localhost:3000`
        
        > Allowed Logout URLs: `http://localhost:3000`
        
        > Allowed Web Origins: `http://localhost:3000`
        
    * Save the changes

   in Connections -> Social -> google-oauth2 -> Applications: deactivate for your created Application (to hide social login)

4. In Applications -> APIs: copy 'API audience' next to Auth0 Management API to the audience attribute in the auth_config.json file

5. Add some users in User Management -> Users:

    * Go to users & create 2 users: bradpots@exampleapp.com & angelinajulie@exampleapp.com

    * in the `user_metadata` of these users add their firstName, name, email, and language. In `app_metadata` add their department. (`user_metadata` is meant for user preferences that they could easily change, whereas `app_metadata` is for user information that an admin would control.) 

      for Brad:  
      
      ```
      user_metadata = {
        "firstName": "Brad",
        "language": "en",
        "email": "bradpots@exampleapp.com",
        "name": "Brad Pots"
      }
      app_metadata = { 
          "parameters": {
            "department": ["Linedoncon"] 
           } 
         }
      ```

      for Angelina: 
      
      ```
      user_metadata = {
          "firstName": "Angelina",
          "language": "nl",
          "email": "angelinajulie@exampleapp.com",
           "name": "Angelina Julie"
         }
      app_metadata = { 
          "parameters": {
            "department": ["Quadbase"] 
           } 
         }
      ```

6. In order for the metadata to be able to be extracted from the jwt tokens we need to add a rule.

    * Go to Auth Pipeline -> Rules and create a rule (using the "Empty rule" template) with name 'Add metadata to token' and use the following function:



```javascript
function (user, context, callback) {
  const namespace = 'https://myexampleapp/';
  user.user_metadata = user.user_metadata || {};
  Object.keys(user.user_metadata).forEach((k) => {
    context.idToken[namespace + k] = user.user_metadata[k];
    context.accessToken[namespace + k] = user.user_metadata[k];
  });
  Object.keys(user.app_metadata).forEach((k) => {
    context.idToken[namespace + k] = user.app_metadata[k];
    context.accessToken[namespace + k] = user.app_metadata[k];
  });
  callback(null, user, context);
}
```

## III. Add your dashboards
  
The dashboards are dynamically retrieved from Cumul.io, all dashboards with the tag "auth0" are retrieved!

## V. Run the app locally

Create a file called '.env' in the root directory. Create an API KEY & TOKEN in your Profile settings under API Tokens and add the next two lines to the '.env' file:

```
CUMULIO_API_KEY = YOUR_API_KEY_HERE
CUMULIO_API_TOKEN = YOUR_API_TOKEN_HERE
```
 
Then run

```
npm install
```

And then 


```
npm run start
```

or

```
node server.js
```

Your app will be listening on port 3000.