
![SuperTokens banner](https://raw.githubusercontent.com/supertokens/supertokens-logo/master/images/Artboard%20%E2%80%93%2027%402x.png)

# SuperTokens Javascript Frontend SDK

<a href="https://supertokens.io/discord">
<img src="https://img.shields.io/discord/603466164219281420.svg?logo=discord"
    alt="chat on Discord"></a>

SuperTokens adds **secure login and session management** to your apps. This is the Javascript Frontend SDK for SuperTokens. [More SDKs are available](https://github.com/supertokens) for frontend and backend e.g. Node.js, Go, Python, React.js, React Native, Vanilla JS, etc.

![Architecture Diagram](https://supertokens.com/img/architecture/self_hosted_generic.png)
SuperTokens architecture is optimized to add secure authentication for your users without compromising on user and developer experience


Learn more at [supertokens.com](https://supertokens.com)


## How to install

Using npm

```
npm i -s supertokens-website
```

OR simply add the following script tag to your HTML pages

```html
<script src="https://cdn.jsdelivr.net/gh/supertokens/supertokens-website/bundle/bundle.js"></script>
```

## How to use

1. Initialize SuperTokens in your frontend 
```javascript
supertokens.init({
    apiDomain: "<URL to your auth backend>"
});
// To be called at least once before any http request is made to any of your APIs that require authentication.
// Now your app will maintain secure SuperTokens sessions for your users
```

2. Make sure your backend has the needed auth functionalities
> You can use one of the SuperTokens backend SDKs for this. 
> Backend SDKs are available for
> * [Node.js backend](https://github.com/supertokens/supertokens-node)
> * [Golang backend](https://github.com/supertokens/supertokens-golang)
> * [Python backend](https://github.com/supertokens/supertokens-python)



Now that's the basic setup. But you might want to do some of the following things

### Checking if a session exists

```
await supertokens.doesSessionExist();
```

### Reading the userId

```
let userId = await supertokens.getUserId();
```

### Reading the JWT payload

```
let payload = await supertokens.getJWTPayloadSecurely();
```

### Submitting form data

Traditionally, when submitting form data, the browser makes an API call for you to submit the data.
With SuperTokens, you will have to make this API call yourself so that correct session interception is added.

```
<html>
    <body>
        
        <form onsubmit="return submitData()">
            Enter name: <input type="text" name="fname">
            <input type="submit" value="Submit">
        </form>

        <script>
            supertokens.init(/* params.. */); // initialise SuperTokens
        </script>

        <script>
        function submitData() {
            // extract element out of the user input field and call API using fetch or axios

            return false; // will prevent any redirection that happens when a form is submitted. 
        }
        </script>

    </body>
</html>
```

### Sign out

The signOut method simply revokes the session on the frontend and backend.

```
supertokens.signOut();
```

### Sending requests with `fetch`

The init function call automatically adds interceptors to fetch. So there is nothing else that needs to be done.

```
supertokens.init({
    apiDomain: "https://api.example.com"
});

async function doAPICalls() {
    try {
        // make API call as usual
        let fetchConfig = { ... };
        let response = await fetch("/someAPI", fetchConfig);

        // handle response
        if (response.status !== 200) {
            throw response;
        }
        let data = await response.json();
        let someField = data.someField;
        // ...
    } catch (err) {
        if (err.status === 401) {
            // redirect user to login
        } else {
            // handle error
        }
    }
}
```

### Sending requests with axios

```
supertokens.addAxiosInterceptors(axios); // To be called on each axios instances being imported
supertokens.init({
    apiDomain: "https://api.example.com"
});

async function doAPICalls() {
    try {
        let postData = { ... };
        let response = await axios({url: "someAPI", method: "post", data: postData });
        let data = await response.data;
        let someField = data.someField;
    } catch (err) {
        if (err.response !== undefined && err.response.status === 401) {
            // redirect user to login
        } else {
            // handle error
        }
    }
}
```

### Server side rendering

For server side rendered apps, there will be instances when the access token has expired. In these cases, you need to use the refresh token to get a new access and a new refresh token.

However, the refresh token is only sent to one API endpoint - the refresh API. This means that for all other APIs, you will not have the refresh token as an input.

Therefore, for refreshing a session during SSR, we must first send a response that manually refreshes the session and then reloads the page.

```
await supertokens.attemptRefreshingSession();
```

* Calling the above function will result in a call to your refresh API. If refreshing succeeds, this function will return a `Promise` that will resolve to `true`, else `false`.
* If successful, you can automatically reload the page and the new access token will be sent to your API.
* If unsuccessful, then you should redirect the user to the login page.


## Documentation
To see documentation, please click [here](https://supertokens.com/docs/community/introduction).

## Contributing
Please refer to the [CONTRIBUTING.md](https://github.com/supertokens/supertokens-website/blob/master/CONTRIBUTING.md) file in this repo.

## Contact us
For any queries, or support requests, please email us at team@supertokens.com, or join our [Discord](supertokens.com/discord) server.

## Authors
Created with :heart: by the folks at SuperTokens.com.
