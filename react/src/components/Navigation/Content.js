import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@awsui/components-react";

import Dashboard from "../Dashboard/Dashboard";
import PlansList from "../Plans/PlansList";
import PlanDetails from "../Plans/PlanDetails";
import KeysList from "../Keys/KeysList";
import KeyDetails from "../Keys/KeyDetails";

function NotFoundPage() {
  return <Box variant="h1">404 Page Not Found</Box>;
}

export default function Content({user, setNotifications}) {

  return (
    <Routes>
      <Route exact path="/" element={<Dashboard user={user} setNotifications={setNotifications}/>} />
      <Route exact path="/plans" element={<PlansList user={user} setNotifications={setNotifications}/>} />
      <Route exact path="/plans/:planId" element={<PlanDetails user={user} setNotifications={setNotifications}/>} />
      <Route exact path="/keys" element={<KeysList user={user} setNotifications={setNotifications}/>} />
      <Route exact path="/key" element={<KeyDetails user={user} setNotifications={setNotifications}/>} /> 
      <Route exact path="/key/:keyId" element={<KeyDetails user={user} setNotifications={setNotifications}/>} /> 
      <Route exact path="/not-found" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate replace to="/not-found" />} /> 
    </Routes>
  );
};

