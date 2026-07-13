
Crowdfunding Platform

Hello Candidate,
Welcome to the job assessment for the position of Junior MERN Stack Developer.
This assessment consists of a project that you will need to complete using MongoDB, Express, React/next js, Node. This project is designed to evaluate your skills. You need to complete this project using Vibe coding. You can use any tools (GitHub Copilot, Claude, Cursor, Antigravity, Windsurf, Trae, Figma Make, Bolt, Lovable, V0, etc.) as you like. This assignment is totally optional, but it's the best way to judge your learning. So don't skip this.
Key Rules
Include a minimum of 20 notable GitHub commits on the client side.
Include a minimum of 12 notable GitHub commits on the server side.
Add a meaningful README.md file with the name of your website, Admin username, password, and live site URL. Include a minimum of 10 bullet points to feature your website.
Make it responsive for all devices — mobile, tablet, and desktop views. Make the dashboard responsive as well.
After reloading the page on a private route, the user should not be redirected to the login page.
Use environment variables to hide the config keys and MongoDB credentials.
Don't use any Lorem ipsum text on your website.
Tips for You
Read and understand the assessment theme carefully.
Select a design and stay stuck with the same color and layout.
Don't go through the whole requirement at once. Complete the requirements one by one.
Good Luck! We wish you the best of luck and look forward to seeing your technical prowess and innovative solutions.

Overview
The Crowdfunding Platform is designed to let creators raise money for projects, causes, and products by collecting Contributions from Supporters. Supporters browse campaigns, contribute platform credits toward the ones they want to support, and creators withdraw the funds they raise once approved by the platform.
You can take design inspiration from crowdfunding sites like Kickstarter, Indiegogo, and GoFundMe. But don't copy the design.
The platform accommodates 3 distinct roles: Supporter, Creator, and Admin. Each role is tailored with specific functionalities to ensure seamless campaign discovery, campaign creation,contributing, and platform administration.
Supporter: Discovers campaigns, Contributions credits to support them, tracks Contributions, purchases credits, and receives notifications.
Creator: Launches and manages campaigns, tracks Supporters and Contributions, posts campaign updates, requests fund withdrawals, and reports issues.
Admin: Oversees platform operations by approving campaigns, managing user roles, processing withdrawal requests, and resolving reports.
Main Requirements
Layout Structure
The layout for the Crowdfunding Platform will be divided into two primary structures: Basic Layout and Dashboard Layout. The Dashboard layout is described after the 4th requirement.
Navbar
Navbar will serve as the primary navigation tool for users, offering easy access to the platform's main features and functionalities. The Navbar will contain the following navigation items:
For Not Logged-in Users
Website Name / Logo
Explore Campaigns
Login
Register
Join as Developer (this button redirects to your client GitHub repository)
For Logged-in Users
Website Name / Logo (clicking redirects the user to the home page)
Dashboard
Available Credits
User Profile and Logout Button
Join as Developer (this button redirects to your client GitHub repository)
Footer
Footer will contain the website logo, and linkable social media icons that will redirect users to your profile, such as LinkedIn, Facebook, GitHub, etc.
Home Page
The homepage will be the first impression of the platform, so it needs to be engaging, informative, and visually appealing. You must use animation on the homepage.
Hero Section
It will contain a slider with three banners. Use React-Responsive Carousel / Swiper Slider. Each slide will contain a different heading and title. You can also use a background video instead of a slider.
Top Funded Campaigns
Show the top 6 campaigns that have raised the maximum amount of credits. Show their cover image, title, and total amount raised.
Testimonial Section
Displays feedback from satisfied users in a slider format. Includes user photos, names, and brief quotes about their positive experiences. This section will be static. Use the Swiper Slider to build this section.
3 Extra Sections
Create a minimum of 3 extra sections with your own idea, for example: "How It Works", "Explore by Category", or "Platform Impact in Numbers".
User Authentication System
The user authentication system will manage the registration and login processes for the platform. It ensures that users can securely access the platform and that the appropriate roles and permissions are assigned. Here's a detailed description of the system:
1. Registration Page
Here, users can create an account by providing the necessary information. After registration, the Supporter will get 50 credits, and the Creator will get 20 credits by default.
There will be 2 types of registration methods that have to be implemented here.
A) Form with Input Fields:
Name + Email + Profile Picture URL + Password
Drop-down to select the role
Supporter
Creator
Implement input validation for email format and password strength. Show error messages for invalid input, such as an existing email.
After registration, the Supporter will get 50 credits, and the Creator will get 20 credits by default. Ensure that users only get the credits once, on registration.
💡 You need to store user info with the credit value in the database.
2. Login Page
Here, users can sign in by providing the necessary information. There will be 2 types of login methods that have to be implemented here.
Users can log in using their registered email and password.
Google Sign-In option for quick authentication.
Implement input validation for incorrect email and password. After successful login/registration, redirect the user to the Dashboard.
After login/registration you have to store a secret access-token for users in their browser local storage.

Dashboard
Layout
The Dashboard will look like this design:
Logo
Available Credits | User Image
User Role | User Name
Notification
Navigation
Sections Based on Routes
Footer

The Dashboard will show the following navigation based on user role:
Supporter
Creator
Admin
Home
Home
Home
Explore Campaigns
Add New Campaign
Manage Users
My Contributions
My Campaigns
Manage Campaigns
Purchase Credit
Withdrawals
Withdrawal Requests
Payment History
Payment History
Reports


Dashboard for Creator
Creator-Home
States
Creators will see their total campaign count (campaigns launched by the user), active campaigns (campaigns where the deadline has not passed), and total amount raised across all campaigns.
Contributions To Review
Creator will see all Contributions for their campaigns where the status is "pending" in a table format with the following information:
Supporter_name
campaign_title
Contribution_amount
View Contribution Button (will open a modal and show the Contribution/message detail)
Actionable Buttons
Approve Button
Reject Button
On clicking the Approve Button:
Add the Contribution amount to the campaign's raised amount.
Change the Contribution status to "approved" for the specific Contribution.
On clicking the Reject Button:
Change the status to "rejected" for the specific Contribution.
Refund the Contribution amount back to the Supporter's available credits.
Add New Campaign
This section will contain a form with the following input fields:
campaign_title     		      (ex: Help us build a solar-powered water pump)
campaign_story                                 // detailed description
category                                              // ex: Technology, Art, Community, Health
funding_goal (number)                  // total credits needed
minimum_Contribution (number)         // smallest amount a Supporter can Contribution
deadline                                           // last date to accept Contributions
reward_info                                    // what Supporters receive for pledging
campaign_image_url                    // cover image to attract Supporters
(Implement imgBB for uploading if you want to get a challenge mark)
Add Campaign Button. On clicking Add Campaign, the new campaign is saved with a status of "pending" and becomes visible to Supporters only after Admin approval.
My Campaigns
In this section, the user will see all the campaigns they added, in descending order based on the deadline, in a table format.
Show the campaign info in columns with Update and Delete buttons:
On clicking Update, users can update the title, campaign_story, and reward_info.
On clicking Delete:
Delete the campaign from the campaigns collection.
Refund all approved Supporters of that campaign their Contributions credits.
Withdrawals
Note: remember a Supporter purchases 10 credits for 1 dollar. But the Creator will withdraw 1 dollar for every 20 credits raised. That's the business logic of how the platform earns.
20 Credits = 1 Dollar.
Creators can withdraw when they have a minimum of 200 credits raised, which is equivalent to 10 dollars.
Creator Total Earnings
Show the user their current raised credits and withdrawal amount in dollars. For example, if a Creator has raised 500 credits, then their withdrawal amount is 25 dollars.
Withdrawal Form
Credits To Withdraw (number)  // cannot exceed the total raised credits
Withdraw_amount ($) (number) — not editable; it changes automatically when the Credits To Withdraw field changes (20 credits = 1 dollar)
Select Payment System (dropdown) — Stripe (you need to implement), Bkash, Rocket, Nagad, or others you can add (these are optional; you can add them for design purposes or experiment with them)
Account Number
Withdraw Button. If the user doesn't have enough credit, hide this button and show the text "Insufficient credit".
On clicking the Withdraw button, save the data into the database with creator_email, creator_name, withdrawal_credit, withdrawal_amount, payment_system, withdraw_date, and a status (pending).
Payment History
Show all withdrawal payments made to the Creator on the Payment History route in a tabular format.

Dashboard for Supporter
Home Page (For Supporter)
States
Supporters will see the total Contributions made (count of all Contributions made by the Supporter), total pending Contributions (count of all Contributions made by the Supporter where status is pending), and total amount contributed (sum of Contribution_amount of the Supporter where status is approved).
Approved Contributions
Supporter will see all the Contributions made by them where the status is "approved" in a table format from the Contributions collection, with the following information:
campaign_title
Contribution_amount
creator_name
status
Explore Campaigns
In this route, the Supporter will see all campaigns where the deadline has not passed and status is "approved", with the following information:
campaign_title
creator_name
deadline
funding_goal
amount_raised
View Details Button
Data will be in card format. Clicking View Details navigates the Supporter to the campaign details route.
Campaign Details
Show all the information of the campaign and a Contribution form in this route. The Contribution form will contain 1 input field (number) named Contribution_amount. After submitting the form, insert and save the Contribution in the database with campaign_id, campaign_title, Contribution_amount, Supporter_email, Supporter_name, creator_name, creator_email, current_date, and a status (pending).
My Contributions
Show all the Contributions where the Supporter_email matches the logged-in Supporter's email. Show data in a tabular form (which data you want to show is up to you). Highlight the Contribution status.
Purchase Credit
From this route, the user can purchase credits. Implement a Stripe-based payment system on this route.
Credit Packages
Credits
Price
100 credits
$10
300 credits
$25
800 credits
$60
1500 credits
$110


Clicking a specific card redirects the user to pay a specific amount. Implement a Stripe-based payment system on it. I know you can do it. After successful payment:
Save the payment info.
Increase the Supporter's credits.
If you can't integrate Stripe payment, add a dummy payment and move on.
Payment History
Show all the payments made by the Supporter on the Payment History route in a tabular format.

Dashboard for Admin
Admin-Home
States
Admin will see the count of total Supporters, total creators, total available credits (sum of all users' credits), and total payments processed.
Campaign Approvals
Admin will see all newly submitted campaigns from the campaigns collection where the status is "pending", in a table format, with Approve and Reject buttons.
On clicking Approve, change the campaign status to "approved" so it becomes visible to Supporters.
On clicking Reject, change the campaign status to "rejected" and notify the creator.
Withdrawal Requests
Admin will see all withdrawal requests from the withdrawals collection made by Creators where the status is pending, in a table format, with a Payment Success button.
After clicking the Payment Success button:
Change the withdrawal request status to "approved".
Decrease the creator's raised credits by the withdrawal amount.
Manage Users
This section will show a table of all users with display_name, user_email, photo_url, role, credits, and some actionable buttons:
Remove (will delete the user from the database). By clicking Remove, the user will be deleted from the server.
Update Role (dropdown field. On change, it will change the role of the user):
Admin
Creator
Supporter
Manage Campaigns
Admin will see the campaign list in a table format with campaign information and a Delete Campaign button (by clicking, the campaign will be deleted from the database).
Reports
Admin will see all campaigns reported by Supporters as suspicious or fraudulent, with the reporter's name, campaign title, reason, and date. Admin can suspend or delete the reported campaign.

Challenges
Secure Authorization
Implement Role-Based Authorization for users. Create middleware for Supporter, Creator, and Admin. 
Notification System
Implement a notification system. Suppose a Creator changes a Contribution status in the Contributions collection; then add a notification in the notifications collection in the following format:
Example
{  message: "Your Contribution of {Contribution_amount} credits to {campaignTitle} was approved by {creatorName}",  toEmail: {SupporterEmail},  actionRoute: "/dashboard/Supporter-home",  time: new Date()}
Do this for approving/rejecting a Contribution by the creator to the Supporter, approving a withdrawal request by the admin to the creator, approving/rejecting a campaign by the admin to the creator, and creating a new Contribution by the Supporter to the creator.
On clicking the notification icon, show all the notifications where the value of the "toEmail" key matches the current user's email, sorted in descending order.
Show notifications in a floating pop-up. By clicking anywhere on the page, the pop-up should be hidden.
Add Pagination on My Contributions Page for Supporter
Implement pagination on the My Contributions route.
Image Uploading System with imgBB
Implement an image uploading system with imgBB on registration and the Add New Campaign route.

Additional Information
You can host images anywhere.
You can use vanilla CSS or any library.
Try to host your site on Vercel. 
Make sure you deploy the server side and client side on the first day. If you have any issues with hosting or GitHub push, please join the "GitHub and Deploy" related support session.
What to Submit
Admin email:
Admin password:
Front-end Live Site Link:
Client-Side GitHub Repository Link:
Server-Side GitHub Repository Link:
Optional
You can also add the following features if you implement them:
1. Automated Email Notifications
Set up automated email notifications for various actions (e.g., campaign approval/rejection, Contribution confirmation, withdrawal processing).
Use services like SendGrid or AWS SES for sending emails.
2. Advanced Search and Filter Functionality
Implement a comprehensive search and filter system for campaigns. Users should be able to filter campaigns based on criteria like category, deadline, funding goal, and status.
Use MongoDB's aggregation framework for efficient querying and filtering on the server side.
3. Report System for Invalid Campaigns
Implement a reporting system for suspicious or fraudulent campaigns so that the admin can take proper action on the user.
