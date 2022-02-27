import * as React from "react";
import { SideNavigation } from "@awsui/components-react";
import { useNavigate } from "react-router-dom";

export default function NavDrawer() {
  let [activeHref, setActiveHref] = React.useState();
  let navigate = useNavigate();

  return (
    <SideNavigation
      activeHref={activeHref}
      // header={{ text: "API Gateway UsagePlan Demo" }}
      items={[
        { type: "link", text: "Dashboard", href: "/" },
        { type: "link", text: "Usage Plans", href: "/plans" },
        { type: "link", text: "API Keys", href: "/keys" },
        {
          type: "section",
          text: "AWS Links",
          items: [
            {
              type: "link",
              text: "AWS UI Documentation",
              href: "https://github.com/aws/awsui-documentation",
              external: true,
            },
          ],
        },
      ]}
      onFollow={(event) => {
        if (!event.detail.external) {
          event.preventDefault();
          setActiveHref(event.detail.href);
          navigate(event.detail.href);
        }
      }}
    ></SideNavigation>
  );
}
