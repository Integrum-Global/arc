# Pages
## Integration
1. Most endpoints are returning 404. Please go through every single widget in every single page and ensure that the endpoints are connected and returning data.
2. I understand that we need mock data to see the actual visuals. Consider putting in a temporary button on the right hand corner of the header to allow me to switch between mock data and live data.

## Dashboard
1. Performance table
   - When I click YTD, the chart visuals will change but the shaded area retracts to the left before extending to the full width of the timeline
   - This also happens to the 1m tab sporadically
   - 3m and 1y no issue
   - I also notice that the retraction of the shaded area is more "severe" for YTD compared to 1m

2. The collapse button at the footer of the sidebar looks weird:
   - The margins/padding (top-bottom) is not the same (top is higher than the bottom)
   - Why is the collapse button at the footer with the text "Collapse"? This does not look like modern UI/UX.
   - Please check modern UI/UX practices and tell me why its weird and how we can resolve this.

3. There are some widgets/components in which I don't really understand the purpose behind them. 
   - Please think carefully from a user perspective and suggest the best placement/implementation for it.
   - Widgets
     - Search bar (in the header)
     - + New Report button

4. Active Alerts
   - Clicking view all and popping a new page seems so old school. Please think from a modern UI/UX perspective and explore/recommend:
   - Infinity scroll within widget
   - Option to expand into a modal

5. Health Score
   - I understand tha the icon is aligned to the other icons in the other boxes in the same row. HOWEVER:
     - The health score icon has a meter bar on top of it, which I really like, but it looks weird because now it's too close to the top border
   - Upon closer inspection, maybe the icons should be centralized within each box. Please think carefully and recommend

6. Portfolio Allocation
   - Why the categories in the pie chart are of the same color?
   - There are 2 boxes in this section but only the 2nd one has a subheader called Top 5 Holdings.
     - We should be consistent and also have a subheader for the pie chart
   - The Top 5 Holdings is too rigid. Please have a filter for top n holdings and have it updated in real-time based on selection.
     - Do the same for the filter (think carefully and include more fields other than 'by market value')

7. I need you to discuss with me on the row (Active Alerts, Morning Brief). You must approach this from a user perspective. This is what I think:
   - Should active alert be on the left or morning brief be on the left? 
   - Active alert should trigger intervention, is a box in the 3rd row sufficient in terms of attention.
     - Should we have a 'breaking news' - requires immediate intervention, and then a recommended active alert for decisions/interventions that have a longer allowance for response time

8. Quick Actions
   - There is a box for 'Refresh Data'. BUT there is already a refresh data on the top right hand corner beneath the header. The quick action button for refresh data seems to be redundant
   - But a bigger question is that: why should we burden the user by having a manual button for refreshing data?
     - Could we change the button to be one in which user can select the intervals for auto-refresh
     - Also consider a multi-selection filter for what data to refresh at what intervals.
     - However, we also don't want to burden the user with too much configuration thus could you think carefully and categorize the themes for auto-refresh instead of the detailed items (prices, news etc.)

9. Refresh
   - When I click on refresh, the values in the page goes blank. This cannot be the case. It should be async and previous values should remain on the screen until the new values are available then seamlessly shown.
   - We also want the user to know which values are refreshed or not refreshed. I need you to research modern ui/ux methods for displaying whether the data in each ui widget is updated and when was it updated
     - Do not display time, you should display how long ago the data was refreshed.

## Portfolios
1. Getting 404 on the main page. (client.ts:163  GET http://localhost:8000/api/v1/portfolios?sort_by=name&sort_order=asc&status=active 404 (Not Found))

## Analytics
1. The drop down list for selecting securities, the whole widget disappears upon each click of a selection. This should not be the case.
   - The names in the select widget is truncated.
2. The ratios are informative, but the way that you present it, no humans can fully utilize the information because it looks like an info dump.
   - Please think carefully and research modern UI UX approaches to visualizing/interacting with this page.
   - Remember that our value is AI assistant, so do not treat it as simply a visual tool. Think deeply how AI assistance can be integrated into this page.
     - For e.g., what does the ratio mean (at the aggregate, at each ratio), what are the insights, how do I compare, what intervention I may require
     - Users may want to ask deeper questions, so we must have a ready real-time AI assistant to answer and help them make sense (or even execution).
3. The information in the analytics page checks all the boxes for information completeness, but it is useless to an investment professional or portfolio owner.
   - Instead of just displaying the information, I want you to think hard:
     - how should we integrate the information and 
     - package them into pockets of insights 
     - with intervention recommendation, and 
     - supported LARGELY by an AI assistant

# Alerts
1. I see alerts EVERYWHERE! (within pages and it even has an ALERT PAGE on its own!)
   - Alerts trigger attention, please remember this principle that alerts should lead to an intervention or at the very least an appreciation of the situation.
   - Relook into the currently useless alerts dumping situation and give me a recommendation on how and where we should use alert
   - Consider alert as a module with customizable self-service activation.

# Login page
1. Create an enterprise login page with the following SSO:
   - Azure AD, Google, Github
2. Implement multi-tenancy for Azure AD
   - Use azurecli via SSO to set up on integrum-global

# Possible feature improvements
1. Users will want to customize the dashboard to their liking
   - I want it to be customization but via self-service
   - It is important that users can immediately see what each section's theme is
     - Please ultrathink, check the docs and codebase to understand, from the user perspective, how should we section/segment the dashboard
     - This is critical because it will then affect what widgets we want to limit to each section/segment.
   - There will be substantial FE and BE work, so be very detailed about what it takes to implement this.