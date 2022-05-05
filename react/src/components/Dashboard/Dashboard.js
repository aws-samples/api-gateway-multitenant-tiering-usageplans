import React, { useState, useEffect } from "react";
import {
  Box,
  Header,
  SpaceBetween,
} from "@awsui/components-react";
import { getPlans } from "../Plans/PlanService";
import { getKeys } from "../Keys/KeyService";
import OverviewPanel from "./OverviewPanel";
import ApiTestPanel from "./ApiTestPanel";

export default function Dashboard({user}) {
  const [plans, setPlans] = useState([]);
  const [keys, setKeys] = useState([]);

  useEffect(() => {
    getPlans(user).then((items) => {
      setPlans(items);
      getKeys(user).then((data) => {
        setKeys(data);
      }).catch((err)=>{
        console.error("ERROR: getKeys() failed", JSON.stringify(err));
      });
    }).catch((err)=>{
      console.error("ERROR: getPlans() failed", JSON.stringify(err));
    });
  }, [user]);

  return (
    <SpaceBetween direction="vertical" size="l" >
      <Box>
        <Header variant="h1">Dashboard</Header>
      </Box>
      <OverviewPanel plans={plans} keys={keys} />
      <ApiTestPanel keys={keys} />
    </SpaceBetween>
  );
}
