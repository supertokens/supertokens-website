import supertokens, { addAxiosInterceptors, signOut, getUserId } from "../";
import axios from "axios";

supertokens.addAxiosInterceptors(axios);
addAxiosInterceptors(axios);


supertokens.attemptRefreshingSession().then((b: boolean) => {
    console.log(b);
}).catch(err => {

});

supertokens.doesSessionExist().then((exists: boolean) => {
    console.log(exists);
}).catch(err => {

});

supertokens.signOut().then(() => {

}).catch(err => {

});

signOut().then(() => {

}).catch(err => {

});

supertokens.init({
    apiDomain: ""
});

supertokens.init({
    apiDomain: "",
    apiBasePath: "",
    autoAddCredentials: true,
    isInIframe: true,
    sessionExpiredStatusCode: 440,
    sessionScope: "",
    cookieDomain: "",
    cookieHandler: () => {
        return {
            getCookie: async function () {
                return "";
            },
            getCookieSync: function() {
                return "";
            },
            setCookie: async function(newString) {
                const _: string = newString;
                return;
            },
            setCookieSync: function (newString) {
                const _: string = newString;
                return;
            },
        };
    },
    windowHandler: (original) => {
        return {
            getDocument: function () {
                return original.getDocument();
            },
            localStorage: {
                ...original.localStorage,
            },
            sessionStorage: {
                ...original.sessionStorage,
            },
            history: {
                getState: function () {
                    return "";
                },
                replaceState: function (data, unused, url) {
                    const _: any = data;
                    const __: string = unused;
                    const ___: string | null | undefined = url;
                },
            },
            location: {
                assign: function (url) {
                    // with-typescript doesnt recognise DOM types, hence any here 
                    const _:any = url;
                    return;
                },
                getHash: function () {
                    return "";
                },
                getHostName: function () {
                    return "";
                },
                getHref: function () {
                    return "";
                },
                getOrigin: function () {
                    return "";
                },
                getPathName: function () {
                    return "";
                },
                getSearch: function () {
                    return "";
                },
                setHref: function (newHref) {
                    const _: string = newHref;
                    return;
                },
            },
        };
    },
    override: {
        functions: (oI) => {
            return {
                ...oI,
                signOut: async (config) => {
                    return oI.signOut(config);
                }
            }
        }
    },
    onHandleEvent: async (context) => {

    },
    preAPIHook: async (context) => {
        return context;
    }
});

supertokens.getAccessTokenPayloadSecurely().then(p => {

}).catch(err => {

});


supertokens.getUserId().then((id: string) => {

}).catch(err => {

});
getUserId().then((id: string) => {

}).catch(err => {

});