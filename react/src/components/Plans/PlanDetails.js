import React, { useEffect, useState } from "react";
import {
  Form,
  Button,
  SpaceBetween,
  Header,
  FormField,
  Container,
  Input,
  Textarea,
} from "@awsui/components-react";
import { useNavigate, useParams } from "react-router";
import { getPlan } from "./PlanService";

export default function PlanDetails({ user, setNotifications }) {
  const [id, setId] = useState();
  const [name, setName] = useState();
  const [description, setDescription] = useState();
  const [quota, setQuota] = useState();
  const [throttle, setThrottle] = useState();
  const [price, setPrice] = useState();
  const navigate = useNavigate();
  const { planId } = useParams();

  useEffect(() => {
    if (planId) {
      getPlan(user, planId).then((plan) => {
        setId(plan.id);
        setName(plan.name);
        setDescription(plan.description);
        setQuota(plan.quota);
        setThrottle(plan.throttle);
        setPrice(plan.price);
      }).catch((reason) => console.error("getPlan() failed: ", reason));
    }
  }, [user, planId]);

  function handleCancel() {
    navigate("/plans");
  }
  return (
    <Form
      actions={
        <Button variant="link" onClick={handleCancel}>
          Cancel
        </Button>
      }
      header={
        <Header variant="h1" description="A detailed view">
          Usage Plan
        </Header>
      }
    >
      <Container header={<Header variant="h2">Usage Plan Data</Header>}>
        <SpaceBetween direction="vertical" size="l">
          <FormField
            label="Plan Id"
            description="This unique ID would not be typically shown to a customer."
          >
            <Input
              disabled={true}
              value={id}
              onChange={(event) => setId(event.detail.value)}
            />
          </FormField>
          <FormField label="Name" description="Plan Name">
            <Input
              disabled={true}
              value={name}
              onChange={(event) => setName(event.detail.value)}
            />
          </FormField>
          <FormField
            label="Description"
            description="Detailed information that does not appear in the list view"
          >
            <Textarea
              disabled={true}
              value={description}
              onChange={(event) => setDescription(event.detail.value)}
            />
          </FormField>
          <FormField
            label="Quota"
            description="Limit on how many calls can be made per unit time."
          >
            <Input
              disabled={true}
              value={quota}
              onChange={(event) => setQuota(event.detail.value)}
            />
          </FormField>
          <FormField
            label="Throttle"
            description="Maximum Transactions Per Second before getting throttled"
          >
            <Input
              disabled={true}
              value={throttle}
              onChange={(event) => setThrottle(event.detail.value)}
            />
          </FormField>
          <FormField
            label="Price"
            description="The fee with purchasing an API Key with this Usage Plan."
          >
            <Input
              disabled={true}
              value={price}
              onChange={(event) => setPrice(event.detail.value)}
            />
          </FormField>
        </SpaceBetween>
      </Container>
    </Form>
  );
}
