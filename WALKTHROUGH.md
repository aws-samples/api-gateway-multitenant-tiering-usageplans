# Walkthrough

This document assumes that you've already successfully built the sample code (see [INSTALL.md](INSTALL.md)). 


After logging in the first time, the application looks like this, with four Usage Plans and no API Keys.

![Dashboard with 4 Usage Plans and no Keys](assets/images/walkthru-dash.png)

Choosing `Usage Plans` on the side panel, we can get more detail about the Usage Plans. In this example, they have different quotas and throttle characteristics. 

![List of Usage Plans](assets/images/walkthru-plans.png)

Create a Key from the `Test Plan` as shown below. This particular plan is useful for demonstration purposes because the quota is very low: 20 calls per day.

![API Key Creation Form](assets/images/walktrhu-newKey.png)

After the key is successfully created, the application lands on the listing of all API Keys available to this user.


![List of API Keys after successful creation](assets/images/walkthru-keySuccess.png)

Going back to the Dashboard, we see that we now have one key.  More importantly, there is a testing utility in the second box of the Dashboard.

![Dashboard after API Key created](assets/images/walkthru-dash2.png)

Select the key from the dropdown and press the `GET` button to issue an HTTP GET command.  The request, with the X-API-KEY Header shows in the left, the response appears in the right, a sample JSON body.

![Dashboard after REST API invoked using API Key](assets/images/walkthru-testPass.png)

Open up the developer tools within the browser and press the GET button several more times. Eventually the 200 HTTP response will change to a 429 response when the quota is expired.

![Using browser developer tools to see when REST API is throttled for exceeding quota](assets/images/walkthru-testLimit.png)

An exception for this quota can be granted via the AWS Console

![AWS Console when granting Usage Extension](assets/images/walkthru-extension.png)