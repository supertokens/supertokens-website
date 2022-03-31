
![SuperTokens banner](https://raw.githubusercontent.com/supertokens/supertokens-logo/master/images/Artboard%20%E2%80%93%2027%402x.png)

# SuperTokens Javascript Frontend SDK

<a href="https://supertokens.io/discord">
<img src="https://img.shields.io/discord/603466164219281420.svg?logo=discord"
    alt="chat on Discord"></a>

SuperTokens adds **secure login and session management** to your apps. This is the Javascript Frontend SDK for SuperTokens. [More SDKs are available](https://github.com/supertokens) for frontend and backend e.g. Node.js, Go, Python, React.js, React Native, Vanilla JS, etc.

![Architecture Diagram](https://supertokens.com/img/architecture/self_hosted_generic.png)
SuperTokens architecture is optimized to add secure authentication for your users without compromising on user and developer experience


Learn more at [supertokens.com](https://supertokens.com)


# How to install

Using npm

```
npm i -s supertokens-website
```

OR simply add the following script tag to your HTML pages

```html
<script src="https://cdn.jsdelivr.net/gh/supertokens/supertokens-website/bundle/bundle.js"></script>
```

# How to use

1. Initialize SuperTokens in your frontend 
```javascript
supertokens.init({
    apiDomain: "<URL to your auth backend>"
});

// Now your app will maintain secure SuperTokens sessions for your users
```
2. Make sure your backend has the needed auth functionalities
> You can use one of the SuperTokens backend SDKs for this. 
> Backend SDKs are available for
> * [Node.js backend](https://github.com/supertokens/supertokens-node)
> * [Golang backend](https://github.com/supertokens/supertokens-golang)
> * [Python backend](https://github.com/supertokens/supertokens-python)


## Documentation
To see documentation, please click [here](https://supertokens.io/docs/community/introduction).

## Contributing
Please refer to the [CONTRIBUTING.md](https://github.com/supertokens/supertokens-website/blob/master/CONTRIBUTING.md) file in this repo.

## Contact us
For any queries, or support requests, please email us at team@supertokens.io, or join our [Discord](supertokens.io/discord) server.

## Authors
Created with :heart: by the folks at SuperTokens.io.
