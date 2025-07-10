export {
    extractFormDataUrl, SINGUP_URL, VERIFY_EMAIL_URL, SEND_RESETPASS_CODE_URL,
    RESET_PASS_URL, GIVE_FREE_CREDITS_URL, CONCAT_URL, QUERY_ORDER_STATUS_URL
};
// const extractFormDataUrl = "http://localhost:3000/api/extractFormData";
// const backEnd = 'http://localhost:3000';
const backEnd = 'https://autocommentai.cc';
const extractFormDataUrl = `${backEnd}/api/extractFormData`;
const SINGUP_URL = `${backEnd}/api/auth/signup`;
const VERIFY_EMAIL_URL = `${backEnd}/api/auth/verify-email`;
const SEND_RESETPASS_CODE_URL = `${backEnd}/api/auth/reset-password/send-code`;
const RESET_PASS_URL = `${backEnd}/api/auth/reset-password/reset-pass`;
const GIVE_FREE_CREDITS_URL = `${backEnd}/api/payment/giveFreeCredits`;
const CONCAT_URL = `${backEnd}/api/concat`;

const QUERY_ORDER_STATUS_URL = 'https://api-autocommentai.randompokegen.cc/api/payment/query-status';
//const QUERY_ORDER_STATUS_URL = 'http://localhost:3000/api/payment/query-status';
