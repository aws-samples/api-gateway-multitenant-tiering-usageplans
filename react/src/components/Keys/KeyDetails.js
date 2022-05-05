import React, { useEffect, useState } from "react";
import {
  Form,
  Button,
  SpaceBetween,
  Header,
  FormField,
  Container,
  Input,
  Select,
  Textarea,
  Toggle
} from "@awsui/components-react";
import { useNavigate, useParams } from "react-router";
import { createKey, getKey, updateKey } from "./KeyService";
import { getPlans } from "../Plans/PlanService";

export default function KeyDetails({ user, setNotifications }) {
  const [id, setId] = useState();
  const [planId, setPlanId] = useState();
  const [name, setName] = useState();
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const navigate = useNavigate();
  const { keyId } = useParams();
  const [planOptions, setPlanOptions] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState();
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (keyId) {
      getKey(user, keyId).then((key) => {
        setId(key.id);
        setPlanId(key.planId);
        setName(key.name);
        setDescription(key.description);
        setEnabled(key.enabled);
      }).catch((reason) => console.error("getKey() failed: ", reason));
    }
  }, [user, keyId, planOptions]);

  useEffect(() => {
    getPlans(user).then((items) => {
      setPlanOptions(
        items.map((item) => ({
          label: item.name,
          value: item.id,
        }))
      );
    }).catch((reason) => console.error("getPLans() failed: ", reason));
  }, [user]);

  function handleCancel() {
    navigate("/keys");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!planId || !name) {
      alert("planID and name are required");
      return;
    }
    if (keyId) {
      setLoading(true);
      updateKey(user, { id, planId, name, description, enabled }).then((json) => {
        console.log("Key updated successfully");
        console.log(json);
        setNotifications([
          {
            type: "success",
            content: "API Key updated successfully.",
            dismissible: true,
            onDismiss: () => setNotifications([]),
          },
        ]);
        navigate("/keys");
      }).catch((reason) => console.error("updateKey() failed: ", reason))
      .finally(()=>setLoading(false));
    } else {
      setLoading(true);
      createKey(user, { planId, name, description, enabled }).then((json) => {
        console.log("Key created successfully");
        console.log(json);
        setNotifications([
          {
            type: "success",
            content: "API Key created successfully.",
            dismissible: true,
            onDismiss: () => setNotifications([]),
          },
        ]);
        navigate("/keys");
      }).catch((reason) => console.error("createKey() failed: ", reason))
      .finally(()=>setLoading(false));
    }
  }

  function handlePlanChange(event) {
    setSelectedPlan(event.detail.selectedOption);
    setPlanId(event.detail.selectedOption.value);
  }

  return (
    <Form
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={handleCancel}>
            Cancel
          </Button>
          <Button loading={isLoading} disabled={isLoading || !planId || !name } variant="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </SpaceBetween>
      }
      header={
        <Header variant="h1" description="API Key details">
          API Key
        </Header>
      }
    >
      <Container
        header={
          <Header variant="h2">
            {keyId ? "Update API Key" : "Purchase API Key"}
          </Header>
        }
      >
        <SpaceBetween direction="vertical" size="l">
          <FormField
            label="Key Id"
            description="This unique ID would not be typically shown to a customer."
          >
            <Input
              disabled={true}
              value={id}
              onChange={(event) => setId(event.detail.value)}
            />
          </FormField>
          <FormField
            label="Plan Id"
            description="This unique ID would not be typically shown to a customer."
          >
            <Input
              disabled={true}
              value={planId}
              onChange={(event) => setPlanId(event.detail.value)}
            />
          </FormField>
          <FormField
            label="Usage Plan"
            description="Once a key is issued, it cannot be applied to a different plan."
          >
            <Select
              disabled={!!keyId}
              options={planOptions}
              selectedOption={selectedPlan}
              onChange={handlePlanChange}
            />
          </FormField>
          <FormField
            label="Name"
            description="User assigned name to their key."
          >
            <Input
              value={name}
              onChange={(event) => setName(event.detail.value)}
            />
          </FormField>
          <FormField
            label="Description"
            description="Additional data about the user's key."
          >
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.detail.value)}
            />
          </FormField>
          <FormField
            label="Enabled"
            description="A user can disable their key temporarily, if they choose."
          >
            <Toggle
              checked={enabled}
              onChange={(event) => setEnabled(event.detail.checked)}
            />
          </FormField>
        </SpaceBetween>
      </Container>
    </Form>
  );
}
