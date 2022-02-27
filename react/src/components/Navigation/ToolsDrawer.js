import * as React from "react";
import { HelpPanel, Button } from "@awsui/components-react";

export default function ToolsDrawer({ user, signOut }) {
  return (
    <HelpPanel
      header={<h2>About this app</h2>}
      footer={
        <div style={{ width: "100%", textAlign: "right" }}>
          <Button
            variant="primary"
            iconName="angle-left-double"
            onClick={signOut}
          >
            Sign Out
          </Button>
        </div>
      }
    >
      {JSON.stringify(user,null,2)}

    </HelpPanel>
  );
}
