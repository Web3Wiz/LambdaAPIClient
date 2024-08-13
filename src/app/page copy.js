"use client";

import { useState } from "react";
import styles from "./page.module.css";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import axios from "axios";

const GatewayApiTest = () => {
  const [gatewayApiUrl, setGatewayApiUrl] = useState(
    process.env.NEXT_PUBLIC_API_GATEWAY_URL
  );
  const [gatewayApiRequest, setGatewayApiRequest] = useState(
    '{"ActionCode":"S.USER","ViewName":"LOGIN","ClientIP":"72.255.40.37","JsonReq":{"JHeader":{"Client":"ELITE","Source":"NativeApp","Target":"DBAPI","DeviceType":"Mobile","DeviceInfo":"iPhone 14 A2483","DeviceID":"72.255.40.37","ViewName":"LOGIN","ActionCode":"S.USER","ClientVersion":"1.0.0","APIVersion":"1.0.1","APILogin":"user@webapis.com","APIPassword":"12345","RequestedURL":"http://domain.com/WebAPI/ProcessRequest","Debug":"false"},"JMetaData":{},"JData":{"p_VP_COMPANY_NUM":"101","p_VP_ACCOUNT_NUM":"","p_VP_LOGIN_ID":"KAZIMBUKHARI@GMAIL.COM","p_VP_PASSWORD":"kazim"}},"Notes":"Test Notes ..."}'
  );
  const [gatewayApiResponseStatus, setGatewayApiResponseStatus] = useState("");
  const [gatewayApiResponseText, setGatewayApiResponseText] = useState("");
  const [authTokenId, setAuthTokenId] = useState();
  //"eyJraWQiOiJHVTNIMUxTeVwvQzlFMUZDd3RKMklFSHJPTmhcLzBLWkwrUXh4QWRNMFFPK3c9IiwiYWxnIjoiUlMyNTYifQ.eyJvcmlnaW5fanRpIjoiMTJmOGM3YjUtOWJiYi00N2VmLTk1YjEtMTZlYTlkZmE3NzFmIiwic3ViIjoiNzQ5OGM0MjgtNjBjMS03MGI4LTE3NWQtNmVlNWRhYTU1Y2ZjIiwiYXVkIjoiMms0bGtwbmo2aDJiM3JqNm9wMWdsMTBodnMiLCJldmVudF9pZCI6ImY4YmJlYTA3LTg4Y2EtNDljOS1hZDQwLWU0MTkyNmU4MjViNyIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNzIyOTUxMDA1LCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9TMUQzcmd3UHYiLCJjb2duaXRvOnVzZXJuYW1lIjoia2F6aW0iLCJleHAiOjE3MjI5NTQ2MDUsImlhdCI6MTcyMjk1MTAwNSwianRpIjoiZTY1MmU5N2EtYWFlOC00ZDY4LWI5NDktOGZiZmZiN2IxYmIxIn0.DuXz1zVNH-XJTwhISN7IPMw5ihRojyIObKJMHP--eh6GxDKvmg5fpZ8wWjHQJVx1pskTuzrV3Xe-peypisAY2YIqbiwbIpjfraMmV4SQRKOjS3yPL7C6MM067e-nZKpmtct9PaPKnEj_Or96SMJVvV8G6CJnpdaoYXR7N_fpI-0sZDyRQhEnv_2YF60zw1D8at44gDF41bsqkt5OvSjwzTkOTSiVMUqrRzeTpEM9cL9V4jfUzylA37TPptFAUWjd7tRqRGdIzaTmWjZ7Y9xw6xclxOpEBIrNKiQEV9_B3-X8qH0L8TXxzjxS7m34tJ_DF351gkw2nzSfcZvvAFIN_g"
  const [username, setUsername] = useState(
    process.env.NEXT_PUBLIC_COGNITO_USERNAME
  );
  const [password, setPassword] = useState(
    process.env.NEXT_PUBLIC_COGNITO_PASSWORD
  );
  const [inProgress, setInProgress] = useState(false);

  const showInProgress = () => setInProgress(true);
  const hideInProgress = () => setInProgress(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    showInProgress();

    try {
      // Step 1: Get an authentication token from Amazon Cognito
      const cognitoToken = await getCognitoToken(username, password);
      setAuthTokenId(cognitoToken);

      // Step 2: Make a request to the AWS Lambda function using API Gateway
      const apiResponse = await callApiGateway(
        gatewayApiUrl,
        gatewayApiRequest,
        cognitoToken
      );
      setGatewayApiResponseStatus(apiResponse.status);
      setGatewayApiResponseText(apiResponse.text);
    } catch (error) {
      setGatewayApiResponseStatus("Error");
      setGatewayApiResponseText(error.message);
    } finally {
      hideInProgress();
    }
  };

  const getCognitoToken = async (username, password) => {
    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_COGNITO_REGION,
    });

    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };

    const command = new InitiateAuthCommand(params);
    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      throw new Error("Failed to fetch Cognito token");
    }

    return response.AuthenticationResult.IdToken; //authTokenId;
  };

  const callApiGateway = async (url, requestPayload, token) => {
    try {
      const response = await axios.post(url, requestPayload, {
        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
          // Authorization:
          //   "Bearer eyJraWQiOiJHVTNIMUxTeVwvQzlFMUZDd3RKMklFSHJPTmhcLzBLWkwrUXh4QWRNMFFPK3c9IiwiYWxnIjoiUlMyNTYifQ.eyJvcmlnaW5fanRpIjoiN2FlMTE1NjgtNTgzMS00ZmY1LWFiOTYtYmE5YTIzNWZmMjIzIiwic3ViIjoiNzQ5OGM0MjgtNjBjMS03MGI4LTE3NWQtNmVlNWRhYTU1Y2ZjIiwiYXVkIjoiMms0bGtwbmo2aDJiM3JqNm9wMWdsMTBodnMiLCJldmVudF9pZCI6IjU2MzAxNTg5LTBmNzItNDhjYi1iN2Y2LWU4NWIxMjE5MDlhNiIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNzIyMjQyOTA2LCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9TMUQzcmd3UHYiLCJjb2duaXRvOnVzZXJuYW1lIjoia2F6aW0iLCJleHAiOjE3MjIyNDY1MDYsImlhdCI6MTcyMjI0MjkwNiwianRpIjoiMWZmYWFmZTctMTMxYi00NmI1LThmMmEtYjZhYmI5ZWEwN2VjIn0.hGGqOvXvdWLw5e-3p26MKGeV1bZfBTExfSGTI4-pbreEEs6zOEaRsaNUNwa7njM_TPdSLPJgovknjcLmTk93TTHRtEoNpUPcJYveaStX7fMBwRdj_t3DVN07BFhiN0kOTbZyjXUxlkWyfaVT2Hl9cnzTdG6ZkrR95bvYK7WKv52MnP8G9NikD-sKNVLgEgZFADtb4qMbUO9sW4gVfli01WTwfNM7Piuvc95Xts7Ehxr9OopojraqvVX4tso194ksfQWomsebk0QbUnvcdWMdPRk5zqAYWsGvIMKIdrSOGfWuzBDya_iUh6Oy_C5sb8QMC2ecSmWOfmQjfAPUJWwAcg",
        },
      });

      return {
        status: `${response.status} ${response.statusText}`,
        text: response.data,
      };
    } catch (error) {
      console.error(
        "Error details:",
        error.response ? error.response.data : error.message
      );
      return {
        status: "Error",
        text: `${error.message}`,
      };
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Gateway API Test</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="txtGatewayAPIURL" className={styles.label}>
            Gateway API URL
          </label>
          <input
            type="text"
            id="txtGatewayAPIURL"
            name="txtGatewayAPIURL"
            value={gatewayApiUrl}
            onChange={(e) => setGatewayApiUrl(e.target.value)}
            className={`${styles.input} ${styles.longInput}`}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="txtGatewayAPIRequest" className={styles.label}>
            Gateway API Request Payload
          </label>
          <textarea
            id="txtGatewayAPIRequest"
            name="txtGatewayAPIRequest"
            value={gatewayApiRequest}
            onChange={(e) => setGatewayApiRequest(e.target.value)}
            className={styles.textArea}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="txtGatewayAPIResponseStatus" className={styles.label}>
            Gateway API Response Status
          </label>
          <input
            type="text"
            id="txtGatewayAPIResponseStatus"
            name="txtGatewayAPIResponseStatus"
            value={gatewayApiResponseStatus}
            readOnly
            className={`${styles.input} ${styles.readOnlyInput}`}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="txtGatewayAPIResponseText" className={styles.label}>
            Gateway API Response
          </label>
          <textarea
            id="txtGatewayAPIResponseText"
            name="txtGatewayAPIResponseText"
            value={gatewayApiResponseText}
            readOnly
            className={styles.textArea}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="txtGatewayAPITokenId" className={styles.label}>
            Authentication Token Id
          </label>
          <textarea
            id="txtGatewayAPITokenId"
            name="txtGatewayAPITokenId"
            value={authTokenId}
            readOnly
            className={styles.textArea}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="txtUsername" className={styles.label}>
            Username
          </label>
          <input
            type="text"
            id="txtUsername"
            name="txtUsername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`${styles.input} ${styles.longInput}`}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="txtPassword" className={styles.label}>
            Password
          </label>
          <input
            type="password"
            id="txtPassword"
            name="txtPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${styles.input} ${styles.longInput}`}
          />
        </div>
        <div className={styles.formGroup}>
          <button
            type="submit"
            name="btnSubmit"
            className={styles.submitButton}
          >
            {inProgress ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GatewayApiTest;