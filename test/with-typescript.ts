import supertokens, { addAxiosInterceptors, signOut, getUserId, BooleanClaim, PrimitiveClaim, SessionClaimValidator, validateClaims } from "../";
import axios from "axios";
import { STGeneralError } from '../utils/error';

STGeneralError.isThisError(new Error())

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
    tokenTransferMethod: "cookie",
    sessionTokenFrontendDomain: "",
    sessionTokenBackendDomain: ".supertokens.com",
    cookieHandler: () => {
        return {
            getCookie: async function () {
                return "";
            },
            setCookie: async function (newString) {
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
                    const _: any = url;
                    return;
                },
                getHash: function () {
                    return "";
                },
                getHostName: function () {
                    return "";
                },
                getHost: function() {
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
            getWindowUnsafe: function () {
                return original;
            }
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


class BoolClaimWithCustomValidators extends BooleanClaim {
    constructor(conf) {
        super(conf);

        this.validators = {
            ...this.validators,
            custVal: (minTimeStamp: number) => ({
                id: "test1-v1",
                refresh: TestBoolClaimWithCustomValidators.refresh,
                shouldRefresh: (payload: any, ctx?: any) =>
                    payload[TestBoolClaimWithCustomValidators.id] === undefined ||
                    payload[TestBoolClaimWithCustomValidators.id].t <= minTimeStamp,
                validate: () => ({ isValid: true }),
            }),
        }
    }

    validators!: BooleanClaim["validators"] & { custVal: (minTimeStamp: number) => SessionClaimValidator};
}

const TestBoolClaimWithCustomValidators = new BoolClaimWithCustomValidators({});

const customValidator = TestBoolClaimWithCustomValidators.validators.custVal(123);
customValidator.validate({}, {});

const TestNumberClaim = new PrimitiveClaim<number>({
    id: "test2",
    refresh: async (ctx) => {
        if (ctx) {
            ctx.refreshCalled = 1;
        }
    },
});

const boolValidator = TestNumberClaim.validators.hasValue(123);

supertokens.validateClaims((oc) => [...oc, boolValidator, customValidator]);

supertokens.validateClaims((oc) => [...oc, boolValidator, customValidator],
    {
        refreshCalled: 0,
    },
);
