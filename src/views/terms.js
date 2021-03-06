// @flow
import React from 'react'
import Header from '../components/header'
import Footer from '../components/footer'
import MapHubsComponent from '../components/MapHubsComponent'
import Reflux from '../components/Rehydrate'
import LocaleStore from '../stores/LocaleStore'
import ErrorBoundary from '../components/ErrorBoundary'

type Props = {
  locale: string,
  _csrf: string,
  footerConfig: Object,
  headerConfig: Object
}

export default class Terms extends MapHubsComponent<Props, void> {
  props: Props

  constructor (props: Props) {
    super(props)
    Reflux.rehydrate(LocaleStore, {locale: this.props.locale, _csrf: this.props._csrf})
  }

  render () {
    return (
      <ErrorBoundary>
        <Header {...this.props.headerConfig} />
        <main className='container'>
          <div className='row'>
            <h4>{MAPHUBS_CONFIG.productName + ' ' + this.__('Terms of Service')}</h4>
          </div>

          <p>
By using this web site (&quot;Service&quot;), or any services of {MAPHUBS_CONFIG.productName}, you are agreeing to be bound by the following terms and conditions (&quot;Terms of Service&quot;). IF YOU ARE ENTERING INTO THIS AGREEMENT ON BEHALF OF A COMPANY OR OTHER LEGAL ENTITY, YOU REPRESENT THAT YOU HAVE THE AUTHORITY TO BIND SUCH ENTITY, ITS AFFILIATES AND ALL USERS WHO ACCESS OUR SERVICES THROUGH YOUR ACCOUNT TO THESE TERMS AND CONDITIONS, IN WHICH CASE THE TERMS &quot;YOU&quot; OR &quot;YOUR&quot; SHALL REFER TO SUCH ENTITY, ITS AFFILIATES AND USERS ASSOCIATED WITH IT. IF YOU DO NOT HAVE SUCH AUTHORITY, OR IF YOU DO NOT AGREE WITH THESE TERMS AND CONDITIONS, YOU MUST NOT ACCEPT THIS AGREEMENT AND MAY NOT USE THE SERVICES.
          </p>
          <p>
Please note that if you are accessing any {MAPHUBS_CONFIG.productName} service in your capacity as a government entity, amended Terms of Service may be required. Please contact us at {MAPHUBS_CONFIG.contactEmail}
          </p>
          <p>
If {MAPHUBS_CONFIG.productName} makes material changes to these Terms, we will notify you by email or by posting a notice on our site before the changes are effective. Any new features that augment or enhance the current Service, including the release of new tools and resources, shall be subject to the Terms of Service. Continued use of the Service after any such changes shall constitute your consent to such changes. You can review the most current version of the Terms of Service at any time at: https://{MAPHUBS_CONFIG.host}/terms
          </p>
          <p>
Violation of any of the terms below will result in the termination of your Account. While {MAPHUBS_CONFIG.productName} prohibits such conduct and Content on the Service, you understand and agree that {MAPHUBS_CONFIG.productName} cannot be responsible for the Content posted on the Service and you nonetheless may be exposed to such materials. You agree to use the Service at your own risk.
          </p>
          <h5>A. Account Terms</h5>
          <ol>
            <li>
You must be 13 years or older to use this Service.
            </li>
            <li>
You must be a human. Accounts registered by &quot;bots&quot; or other automated methods are not permitted.
            </li>
            <li>
You must provide your name, a valid email address, and any other information requested in order to complete the signup process.
            </li>
            <li>
Your login may only be used by one person - i.e., a single login may not be shared by multiple people.
            </li>
            <li>
You are responsible for maintaining the security of your account and password. {MAPHUBS_CONFIG.productName} cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
            </li>
            <li>
You are responsible for all Content posted and activity that occurs under your account.
            </li>
            <li>
You may not use the Service for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright or trademark laws).
            </li>
          </ol>
          <h5>B. Cancellation and Termination</h5>
          <ol>
            <li>
              {MAPHUBS_CONFIG.productName}, in its sole discretion, has the right to suspend or terminate your account and refuse any and all current or future use of the Service, or any other {MAPHUBS_CONFIG.productName} service, for any reason at any time. Such termination of the Service will result in the deactivation or deletion of your Account or your access to your Account, and the forfeiture and relinquishment of all Content in your Account. {MAPHUBS_CONFIG.productName} reserves the right to refuse service to anyone for any reason at any time.
            </li>
            <li>
In the event that {MAPHUBS_CONFIG.productName} takes action to suspend or terminate an account, we will make a reasonable effort to provide the affected account owner with a copy of their account contents upon request, unless the account was suspended or terminated due to unlawful conduct.
            </li>
          </ol>
          <h5>C. Modifications to the Service</h5>
          <ol>
            <li>
              {MAPHUBS_CONFIG.productName} reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
            </li>
            <li>
              {MAPHUBS_CONFIG.productName} shall not be liable to you or to any third-party for any modification, suspension or discontinuance of the Service.
            </li>
          </ol>
          <h5>D. Copyright and Content Ownership</h5>
          <ol>
            <li>
We claim no intellectual property rights over the material you provide to the Service. Your profile and materials uploaded remain yours.
            </li>
            <li>
All {MAPHUBS_CONFIG.productName} Content is intended to be viewed publicly, unless otherwise indicated, you agree to allow others to view your Content. By adding your content to {MAPHUBS_CONFIG.productName}, you agree to allow others to view and export your Content.
            </li>
            <li>
You are responsible for correctly attributing the data source and license. We encourage releasing data you own under an open data license.
            </li>
            <li>
              {MAPHUBS_CONFIG.productName} does not pre-screen Content, but {MAPHUBS_CONFIG.productName} and its designee have the right (but not the obligation) in their sole discretion to refuse or remove any Content that is available via the Service.
            </li>
            <li>
You shall defend {MAPHUBS_CONFIG.productName} against any claim, demand, suit or proceeding made or brought against {MAPHUBS_CONFIG.productName} by a third-party alleging that Your Content, or Your use of the Service in violation of this Agreement, infringes or misappropriates the intellectual property rights of a third-party or violates applicable law, and shall indemnify {MAPHUBS_CONFIG.productName} for any damages finally awarded against, and for reasonable attorney’s fees incurred by, {MAPHUBS_CONFIG.productName} in connection with any such claim, demand, suit or proceeding; provided, that {MAPHUBS_CONFIG.productName} (a) promptly gives You written notice of the claim, demand, suit or proceeding; (b) gives You sole control of the defense and settlement of the claim, demand, suit or proceeding (provided that You may not settle any claim, demand, suit or proceeding unless the settlement unconditionally releases {MAPHUBS_CONFIG.productName} of all liability); and (c) provides to You all reasonable assistance, at Your expense.
            </li>
            <li>
The {MAPHUBS_CONFIG.productName} name and the {MAPHUBS_CONFIG.productName} logo are copyright © {MAPHUBS_CONFIG.productName}. All rights reserved. You may not use the {MAPHUBS_CONFIG.productName} logo or name for without permission. The MapHubs code is open source and available at https://github.com/maphubs/maphubs MapHubs code is licensed under GPL-v2. Copying, distributing, and modifying the code are subject to the the license at https://github.com/maphubs/maphubs/blob/master/LICENSE.txt
            </li>
            <li>
              {MAPHUBS_CONFIG.productName} creates groups for organizations with public and open data that we find on the  internet. We encourage data owners to take ownership of their data in {MAPHUBS_CONFIG.productName}. To request ownership of a group managed by {MAPHUBS_CONFIG.productName}, contact us at {MAPHUBS_CONFIG.contactEmail} and we will work with you to verify your identity and transfer the group to your account.
            </li>
            <li>
              {MAPHUBS_CONFIG.productName} creates groups and map layers as indexes (links) to data publicly available on the internet or data released under public domain or open data licences. By default {MAPHUBS_CONFIG.productName} may link to data services (map tiles or map services). In most cases this is preferable to the end-user as they are getting the latest data directly from the official source. This data is not stored by {MAPHUBS_CONFIG.productName} and is transmitted directly from the source server to the end-user’s browser. For concerns regarding links to data services please contact us at {MAPHUBS_CONFIG.contactEmail}. {MAPHUBS_CONFIG.productName} has no obligation to remove public domain data or open licensed data as long as it is properly attributed and complies with the terms of the license. {MAPHUBS_CONFIG.productName} has no obligation to remove links to public-facing websites (i.e. web pages also indexed by search engines).
            </li>
          </ol>

          <h5>E. General Conditions</h5>
          <ol>
            <li>
Your use of the Service is at your sole risk. The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
            </li>
            <li>
Support for {MAPHUBS_CONFIG.productName} services is only available in English, via email or via the MapHubs code project on GitHub.  We do not guarantee support for free services.  (CrowdCover LLC also offers additional paid consulting and support services, please contact us at {MAPHUBS_CONFIG.contactEmail})
            </li>
            <li>
You understand that {MAPHUBS_CONFIG.productName} uses third-party vendors and hosting partners to provide the necessary hardware, software, networking, storage, and related technology required to run the Service.
            </li>
            <li>
You must not modify, adapt or hack the Service or modify another website so as to falsely imply that it is associated with the Service, {MAPHUBS_CONFIG.productName}, or any other {MAPHUBS_CONFIG.productName} service.
            </li>
            <li>
You may use the {MAPHUBS_CONFIG.productName} hub and story services solely as permitted and intended to host your organization pages, personal pages, or project pages, and for no other purpose. You may not use {MAPHUBS_CONFIG.productName} hubs and stories in violation of the rights of {MAPHUBS_CONFIG.productName} or in violation of applicable law. {MAPHUBS_CONFIG.productName} reserves the right at all times to reclaim any {MAPHUBS_CONFIG.productName} subdomain without liability to you.
            </li>
            <li>
You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service, use of the Service, or access to the Service without the express written permission by {MAPHUBS_CONFIG.productName}.
            </li>
            <li>
We may, but have no obligation to, remove Content and Accounts containing Content that we determine in our sole discretion are unlawful, offensive, threatening, libelous, defamatory, pornographic, obscene or otherwise objectionable or violates any party&#39;s intellectual property or these Terms of Service.
            </li>
            <li>
We may, but have no obligation to, remove Content and Accounts due to destructive actions, vandalism, or attempts at censorship of public domain or open-licensed data.
            </li>
            <li>
Verbal, physical, written or other abuse (including threats of abuse or retribution) of any {MAPHUBS_CONFIG.productName} customer, employee, member, or officer will result in immediate account termination.
            </li>
            <li>
You understand that the technical processing and transmission of the Service, including your Content, may be transferred unencrypted and involve (a) transmissions over various networks; and (b) changes to conform and adapt to technical requirements of connecting networks or devices.
            </li>
            <li>
You must not upload, post, host, or transmit unsolicited email, SMSs, or &quot;spam&quot; messages.
            </li>
            <li>
You must not transmit any worms or viruses or any code of a destructive nature.
            </li>
            <li>
If your bandwidth usage significantly exceeds the average bandwidth usage (as determined solely by {MAPHUBS_CONFIG.productName}) of other {MAPHUBS_CONFIG.productName} customers, we reserve the right to immediately disable your account.
            </li>
            <li>
              {MAPHUBS_CONFIG.productName} does not warrant that (i) the service will meet your specific requirements, (ii) the service will be uninterrupted, timely, secure, or error-free, (iii) the results that may be obtained from the use of the service will be accurate or reliable, (iv) the quality of any products, services, information, or other material purchased or obtained by you through the service will meet your expectations, and (v) any errors in the Service will be corrected. or throttle your file hosting until you can reduce your bandwidth consumption.
            </li>
            <li>
You expressly understand and agree that {MAPHUBS_CONFIG.productName} shall not be liable for any direct, indirect, incidental, special, consequential or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data or other intangible losses (even if {MAPHUBS_CONFIG.productName} has been advised of the possibility of such damages), resulting from: (i) the use or the inability to use the service; (ii) the cost of procurement of substitute goods and services resulting from any goods, data, information or services purchased or obtained or messages received or transactions entered into through or from the service; (iii) unauthorized access to or alteration of your transmissions or data; (iv) statements or conduct of any third-party on the service; (v) or any other matter relating to the service.
            </li>
            <li>
The failure of {MAPHUBS_CONFIG.productName} to exercise or enforce any right or provision of the Terms of Service shall not constitute a waiver of such right or provision. The Terms of Service constitute the entire agreement between you and {MAPHUBS_CONFIG.productName} and govern your use of the Service, superseding any prior agreements between you and {MAPHUBS_CONFIG.productName} (including, but not limited to, any prior versions of the Terms of Service). You agree that these Terms of Service and Your use of the Service are governed under the laws of the District of Columbia.
            </li>
            <li>
Questions about the Terms of Service should be sent to {MAPHUBS_CONFIG.contactEmail}.
            </li>
            <li>
If you are a government user or otherwise accessing or using any {MAPHUBS_CONFIG.productName} service in a government capacity, you may need us to amend these terms. Please contact us at {MAPHUBS_CONFIG.contactEmail}.
            </li>
            <li>
The base map as well as map data indicated as sourced from OpenStreetMap is copyright OpenStreetMap contributors and licensed under the Open Data Commons Open Database License. The base map design and imagery subject to the MapBox Terms of Service.
            </li>
          </ol>

        </main>
        <Footer {...this.props.footerConfig} />
      </ErrorBoundary>
    )
  }
}
