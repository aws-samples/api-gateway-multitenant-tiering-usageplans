import React, { useEffect, useState } from "react";
import {
  Box,
  ColumnLayout,
  Container,
  Header,
  SpaceBetween,
  Button,
  Select,
  TextContent,
} from "@awsui/components-react";

import config from "../../config.json";
const useLocal = config.USE_LOCAL_API;
const localUrlBase = config.LOCAL_API_BASE; 
const remoteUrlBase = config.REST_API_BASE;

const url = useLocal ? localUrlBase : remoteUrlBase;

export default function ApiTestPanel({ keys }) {
  const [req, setReq] = useState("");
  const [resp, setResp] = useState("");
  const [keyOptions, setKeyOptions] = useState([]);
  const [selectedKey, setSelectedKey] = useState();
  const [keyValue, setKeyValue] = useState();

  useEffect(() => { 
    setKeyOptions(
      keys.map((item) => ({
        label: item.name, 
        value: item.value,
      }))
    );
  }, [keys])

  function handleKeyChange(event) {
    setSelectedKey(event.detail.selectedOption);
    setKeyValue(event.detail.selectedOption.value)
  }

  function handleGet() {
    setReq(`GET ${url}/api\nX-Api-Key: ${keyValue}`);

    fetch(`${url}/api`, { 
      method: 'GET', 
      headers: { 
        'x-api-key': keyValue, 
        Accept: 'application/json', 
        'Content-Type': 'application/json',
      }
    }).then(data => data.json())
    .then(data => setResp(JSON.stringify(data)))
    .catch((reason) => { setResp("ERROR\n" + reason); console.log(reason)});
  }

  function handleClear() {
    setReq("");
    setResp("");
  }

  return (
    <Container
      header={<Header description="Demonstrate API calls.">API Test</Header>}
    >
      <SpaceBetween direction="vertical">
        <SpaceBetween direction="horizontal" size="m">
          <Box>{url}/api</Box>
          <Select
            // disabled={!!keyId}
            options={keyOptions}
            selectedOption={selectedKey}
            onChange={handleKeyChange}
          />
          <Button onClick={handleGet} variant="primary">
            GET
          </Button>
          <Button onClick={handleClear}>Clear</Button>
        </SpaceBetween>

        <ColumnLayout columns="2">
          <div key="req"><h3>Request:</h3><TextContent>{req}</TextContent></div>
          <div key="resp"><h3>Response:</h3><TextContent>{resp}</TextContent></div>
        </ColumnLayout>
      </SpaceBetween>
    </Container>
  );
}
