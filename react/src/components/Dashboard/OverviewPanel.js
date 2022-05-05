import React from "react";
import {
  Box,
  ColumnLayout,
  Container,
  Header,
  Link,
} from "@awsui/components-react";
import EmptyState from "../Navigation/EmptyState";

export default function OverviewPanel({ plans, keys }) {

  return (
    <Container
      header={
        <Header description="API Keys by Usage Plan" variant="h2">
          Service Overview
        </Header>
      }
    >
      <ColumnLayout columns={plans.length}>
        {plans ? (
          plans.map((plan) => {
            return (
              <div key={plan.id}>
                <Box>{plan.name}</Box>
                <Link fontSize="display-l" href="#">
                  {keys.filter((key) => key.planId === plan.id).length}
                </Link>
              </div>
            );
          })
        ) : (
          <EmptyState title="No Data" subtitle="No Usage Plans to display." />
        )}
      </ColumnLayout>
    </Container>
  );
}
