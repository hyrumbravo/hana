export const smsSettings ={
    //all required settings for sms 
    urlOTP: "/v3/api/pin/send",  //otp - returns ref code
    urlVerify: '/v3/api/pin/verify', //validates reference code and user pin input
    urlBroadcast: '/v3/api/broadcast', //one-way sms broadcast
    M360_APP_KEY:'I9WhpViPjbmPT0gE',
    M360_APP_SECRET:'7xnWDUKIPpMcHs8u',
    shortcode_mask: 'UPWARD', 
    minute_validity: 5, //minutes in between otp can be validated
}