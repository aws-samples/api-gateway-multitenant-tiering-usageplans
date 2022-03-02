import * as React from "react";
import { HelpPanel, Button } from "@awsui/components-react";

export default function ToolsDrawer({ user, signOut }) {
  
  function jwtToClipboard() { 
    navigator.clipboard.writeText(user.signInUserSession.idToken.jwtToken).then(()=>{
      // success
    }, () => { 
      // fail
    });
  }
  
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
    <ul>
    <li><strong>cognito:username:</strong><br/> {user.signInUserSession.idToken.payload.sub}</li>
    <li><strong>email: </strong><br/> {user.signInUserSession.idToken.payload.email}</li>
    <li><strong>JWT token:</strong> &nbsp; &nbsp;  
    <Button
    iconName="copy"
    onClick={jwtToClipboard}
    >
    Copy
    </Button>
    <br/> {user.signInUserSession.idToken.jwtToken}</li>
    </ul>
    
    </HelpPanel>
    );
  }
