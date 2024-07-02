import {
  Box,
  ColumnLayout,
  Container,
  Header,
  Link,
} from "@awsui/components-react";
import React from "react";
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
              <div key={plan.id.S}>
                <Box>{plan.name.S}</Box>
                <Link fontSize="display-l" href="#">
                  {keys.filter((key) => key.planId.S === plan.id.S).length}
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
