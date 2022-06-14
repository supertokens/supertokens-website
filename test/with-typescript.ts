import supertokens, { addAxiosInterceptors, signOut, getUserId, BooleanClaim, PrimitiveClaim, SessionClaimValidator, validateClaims } from "../";
import axios from "axios";

supertokens.addAxiosInterceptors(axios, {});
addAxiosInterceptors(axios, undefined);


supertokens.attemptRefreshingSession().then((b: boolean) => {
    console.log(b);
}).catch(err => {

});

supertokens.doesSessionExist({
    userContext: {
        key: "value",
    },
}).then((exists: boolean) => {
    console.log(exists);
}).catch(err => {

});

supertokens.signOut({
    userContext: undefined,
}).then(() => {

}).catch(err => {

});

signOut({
    userContext: {},
}).then(() => {

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

supertokens.getAccessTokenPayloadSecurely(undefined).then(p => {

}).catch(err => {

});


supertokens.getUserId({
    userContext: undefined,
}).then((id: string) => {

}).catch(err => {

});
getUserId({
    userContext: {},
}).then((id: string) => {

}).catch(err => {

});


const TestBoolClaimWithCustomValidators: BooleanClaim<{ custVal: (minTimeStamp: number) => SessionClaimValidator }> =
    new BooleanClaim(
        {
            id: "test1",
            refresh: async (ctx) => {
                if (ctx) {
                    ctx.refreshCalled = 1;
                }
            },
        },
        {
            custVal: (minTimeStamp) => ({
                id: "test1-v1",
                refresh: TestBoolClaimWithCustomValidators.refresh,
                shouldRefresh: (payload: any, ctx?: any) =>
                    payload[TestBoolClaimWithCustomValidators.id] === undefined ||
                    payload[TestBoolClaimWithCustomValidators.id].t <= minTimeStamp,
                validate: () => ({ isValid: true }),
            }),
        }
    );

const customValidator = TestBoolClaimWithCustomValidators.validators.custVal(123);
customValidator.validate({}, {});

const TestBoolClaim = new PrimitiveClaim<number>({
    id: "test2",
    refresh: async (ctx) => {
        if (ctx) {
            ctx.refreshCalled = 1;
        }
    },
});

const boolValidator = TestBoolClaim.validators.hasValue(123);

supertokens.validateClaims([boolValidator, customValidator]);

validateClaims([boolValidator, customValidator],
    {
        refreshCalled: 0,
    },
);
