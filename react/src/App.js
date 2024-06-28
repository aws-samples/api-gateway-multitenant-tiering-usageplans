import React, { useState } from "react";
import { Amplify } from 'aws-amplify'
import awsconfig from "./aws-exports";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import {
  AppLayout,
  Flashbar,
  TopNavigation,
} from "@awsui/components-react";
import "@awsui/global-styles/index.css";

import NavDrawer from "./components/Navigation/NavDrawer";
import ToolsDrawer from "./components/Navigation/ToolsDrawer";
import Content from "./components/Navigation/Content";

// Configure Amplify with your awsconfig
Amplify.configure(awsconfig);

export default function App() {
  const [notifications, setNotifications] = useState([]);
  const i18nStrings = {
    overflowMenuTriggerText: "More",
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div>
          <div id="h">
            <TopNavigation
              identity={{ href: "#", title: "API Gateway Demo" }}
              i18nStrings={i18nStrings}
              utilities={[
                {
                  type: "button",
                  iconName: "angle-left-double",
                  text: "Sign Out",
                  onClick: signOut,
                },
              ]}
            />
          </div>
          <AppLayout
            notifications={<Flashbar items={notifications} />}
            navigation={<NavDrawer />}
            tools={<ToolsDrawer user={user} signOut={signOut} />}
            content={<Content user={user} setNotifications={setNotifications} />}
            headerSelector="#h"
          />
        </div>
      )}
    </Authenticator>
  );
}
