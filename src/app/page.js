"use client";

import { useState, useEffect } from "react";
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
  const [gatewayApiRequest, setGatewayApiRequest] = useState();
  const [gatewayApiResponseStatus, setGatewayApiResponseStatus] = useState("");
  const [gatewayApiResponseText, setGatewayApiResponseText] = useState("");
  const [authTokenId, setAuthTokenId] = useState();
  const [username, setUsername] = useState(
    process.env.NEXT_PUBLIC_COGNITO_USERNAME
  );
  const [password, setPassword] = useState(
    process.env.NEXT_PUBLIC_COGNITO_PASSWORD
  );
  const [inProgress, setInProgress] = useState(false);
  const [gettingToken, setGettingToken] = useState(false);

  const [infoLabel, setInfoLabel] = useState("");
  const [actionCodes, setActionCodes] = useState([]);
  const [selectedActionCode, setSelectedActionCode] = useState("");

  const showInProgress = () => setInProgress(true);
  const hideInProgress = () => setInProgress(false);
  const showGettingToken = () => setGettingToken(true);
  const hideGettingToken = () => setGettingToken(false);

  useEffect(() => {
    // Fetch action codes from JSON file when component mounts
    const fetchActionCodes = async () => {
      try {
        const response = await fetch("/data/requestPayload.json");
        if (!response.ok) {
          throw new Error("Failed to load action codes");
        }
        const data = await response.json();
        setActionCodes(data);
      } catch (error) {
        console.error("Error fetching action codes:", error);
      }
    };

    fetchActionCodes();
  }, []);

  const handleActionCodeChange = async (e) => {
    const selectedCode = e.target.value;
    setSelectedActionCode(selectedCode);

    // Find selected action code data
    const selectedAction = actionCodes.find(
      (action) => action.code === selectedCode
    );

    if (selectedAction) {
      setGatewayApiRequest(JSON.stringify(selectedAction.payload, null, 2));
    }
  };

  const getAuthToken = async (e) => {
    e.preventDefault();
    showGettingToken();
    try {
      setInfoLabel("");
      //Get an authentication token from Amazon Cognito
      const cognitoToken = await getCognitoToken(username, password);
      setAuthTokenId(cognitoToken);
      setInfoLabel("New token generated.");
    } catch (error) {
      setAuthTokenId("Error:" + error.message);
    } finally {
      hideGettingToken();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showInProgress();

    try {
      let info = "";
      // Step 1: Get an authentication token from Amazon Cognito if it's not available
      let cognitoToken = null;
      if (authTokenId == null) {
        cognitoToken = await getCognitoToken(username, password);
        setAuthTokenId(cognitoToken);
        info = "New token generated. ";
      } else cognitoToken = authTokenId;

      // Step 2: Make a request to the AWS Lambda function using API Gateway
      const apiResponse = await callApiGateway(
        gatewayApiUrl,
        gatewayApiRequest,
        cognitoToken
      );
      setGatewayApiResponseStatus(apiResponse.status);
      setGatewayApiResponseText(apiResponse.text);
      if (apiResponse.status == 200)
        info += "API response received successfully.";

      setInfoLabel(info);
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

    return response.AuthenticationResult.IdToken;
  };

  const callApiGateway = async (url, requestPayload, token) => {
    try {
      const response = await axios.post(url, requestPayload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        status: "API Gateway Error",
        text: `${error.message}`,
      };
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Gateway API Test</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
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
            type="button"
            name="btnGetToken"
            onClick={getAuthToken}
            className={styles.submitButton}
          >
            {gettingToken ? "Getting Token..." : "Get Token"}
          </button>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.infolabel}>{infoLabel}</label>
        </div>

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
          <label htmlFor="actionCode" className={styles.label}>
            Gateway API Request Action Code
          </label>
          <select
            id="actionCode"
            name="actionCode"
            value={selectedActionCode}
            onChange={handleActionCodeChange}
            className={`${styles.input} ${styles.longInput}`}
          >
            <option value="">Select Action Code</option>
            {actionCodes.map((action) => (
              <option key={action.code} value={action.code}>
                {action.code}
                {" ( "}
                {action.desc}
                {" )"}
              </option>
            ))}
          </select>
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
          <button
            type="submit"
            name="btnSubmit"
            className={styles.submitButton}
          >
            {inProgress ? "Making Request..." : "Make API Request"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GatewayApiTest;
