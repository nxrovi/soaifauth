'use client'

import { useState } from 'react'
import { Icon } from '@/components/icons/Icon'

interface UpgradeProps {
  user?: {
    name?: string | null
    email?: string
    avatarUrl?: string | null
  }
}

export const Upgrade: React.FC<UpgradeProps> = ({ user }) => {
  const [isAnnual, setIsAnnual] = useState(true)

  const features = {
    tester: [
      { name: '1 Application', included: true },
      { name: '10 Licenses', included: true, tooltip: 'Allow users to register on your application. Licenses can not be deleted while on the tester plan' },
      { name: '10 Users', included: true, tooltip: 'Users can not be deleted while on the tester plan' },
      { name: 'Subscriptions', included: true, tooltip: 'Grant access to different parts of your application to different subscriptions.' },
      { name: 'Tokens', included: true, tooltip: 'Require clients to have a token (in addition to a license) in order to access your application.' },
      { name: '5 Global Variables', included: true, tooltip: 'View/Edit data for clients. All clients will see the same data.' },
      { name: 'User Variables', included: true, tooltip: 'View/Edit data for clients. Each client will see their own data.' },
      { name: 'Blacklists', included: true, tooltip: 'Restrict access from requests based on: IP Addresses, Hardware Addresses, Region/State, Country Code, ASN Number' },
      { name: 'Whitelists', included: true, tooltip: 'Grant access from requests based on: IP Addresses' },
      { name: 'Web Loader', included: true, tooltip: 'Control your application from the web. This allows you to control your application from a web browser.' },
      { name: '20 Logs (Discord Included)', included: true, tooltip: 'Send data/logs to your KeyAuth dashboard, or to your Discord Server.' },
      { name: '10mb File Upload', included: true, tooltip: 'Allow clients to download files that you upload. It\'s important to note that KeyAuth does not host files. We act as a proxy.' },
      { name: 'Custom Response Message', included: true, tooltip: 'Customize the response messages that are sent to the client when performing certain actions.' },
      { name: 'Hash Check', included: true, tooltip: 'Prevent users from using altered versions of your software.' },
      { name: 'Auto-Update', included: true, tooltip: 'Allow users to automatically update your software if the version is outdated.' },
      { name: 'Application Function Management', included: true, tooltip: 'Enable/Disable application functions without altering your application.' },
      { name: 'Audit Logs', included: false, tooltip: 'View logs of reseller actions.' },
      { name: 'Webhooks', included: false, tooltip: 'Send data between applications using HTTPS requests.' },
      { name: 'Reseller/Manager Accounts', included: false, tooltip: 'Resellers: Create licenses, Manage their users. Managers: Complete access control based on the permissions given' },
      { name: 'Chatrooms', included: false, tooltip: 'Allow users to communicate with each other.' },
      { name: 'Seller API Access', included: false, tooltip: 'Run all functions that are available on the Dashboard, via API anywhere you can make a request.' },
      { name: 'Discord Bot', included: false, tooltip: 'Run all functions that are available on the Dashboard, via API on the Discord Bot' },
      { name: 'Telegram Bot', included: false, tooltip: 'Run all functions that are available on the Dashboard, via API on the Telegram Bot' },
    ],
    developer: [
      { name: 'Unlimited Applications', included: true },
      { name: 'Unlimited Licenses', included: true, tooltip: 'Allow users to register on your application.' },
      { name: 'Unlimited Users', included: true },
      { name: 'Subscriptions', included: true, tooltip: 'Grant access to different parts of your application to different subscriptions.' },
      { name: 'Tokens', included: true, tooltip: 'Require clients to have a token (in addition to a license) in order to access your application.' },
      { name: 'Unlimited Global Variables', included: true, tooltip: 'View/Edit data for clients. All clients will see the same data.' },
      { name: 'User Variables', included: true, tooltip: 'View/Edit data for clients. Each client will see their own data.' },
      { name: 'Blacklists', included: true, tooltip: 'Restrict access from requests based on: IP Addresses, Hardware Addresses, Region/State, Country Code, ASN Number' },
      { name: 'Whitelists', included: true, tooltip: 'Grant access from requests based on: IP Addresses' },
      { name: 'Web Loader', included: true, tooltip: 'Control your application from the web. This allows you to control your application from a web browser.' },
      { name: 'Logs (Discord Included)', included: true, tooltip: 'Send data/logs to your KeyAuth dashboard, or to your Discord Server.' },
      { name: '50mb File Upload', included: true, tooltip: 'Allow clients to download files that you upload. It\'s important to note that KeyAuth does not host files. We act as a proxy.' },
      { name: 'Custom Response Message', included: true, tooltip: 'Customize the response messages that are sent to the client when performing certain actions.' },
      { name: 'Hash Check', included: true, tooltip: 'Prevent users from using altered versions of your software.' },
      { name: 'Auto-Update', included: true, tooltip: 'Allow users to automatically update your software if the version is outdated.' },
      { name: 'Application Function Management', included: true, tooltip: 'Enable/Disable application functions without altering your application.' },
      { name: 'Audit Logs', included: true, tooltip: 'View logs of reseller actions.' },
      { name: 'Webhooks', included: true, tooltip: 'Send data between applications using HTTPS requests.' },
      { name: 'Reseller/Manager Accounts', included: true, tooltip: 'Resellers: Create licenses, Manage their users. Managers: Complete access control based on the permissions given' },
      { name: 'Chatrooms', included: false, tooltip: 'Allow users to communicate with each other.' },
      { name: 'Seller API Access', included: false, tooltip: 'Run all functions that are available on the Dashboard, via API anywhere you can make a request.' },
      { name: 'Discord Bot', included: false, tooltip: 'Run all functions that are available on the Dashboard, via API on the Discord Bot' },
      { name: 'Telegram Bot', included: false, tooltip: 'Run all functions that are available on the Dashboard, via API on the Telegram Bot' },
    ],
    seller: [
      { name: 'Unlimited Applications', included: true },
      { name: 'Unlimited Licenses', included: true, tooltip: 'Allow users to register on your application.' },
      { name: 'Unlimited Users', included: true },
      { name: 'Subscriptions', included: true, tooltip: 'Grant access to different parts of your application to different subscriptions.' },
      { name: 'Tokens', included: true, tooltip: 'Require clients to have a token (in addition to a license) in order to access your application.' },
      { name: 'Unlimited Global Variables', included: true, tooltip: 'View/Edit data for clients. All clients will see the same data.' },
      { name: 'User Variables', included: true, tooltip: 'View/Edit data for clients. Each client will see their own data.' },
      { name: 'Blacklists', included: true, tooltip: 'Restrict access from requests based on: IP Addresses, Hardware Addresses, Region/State, Country Code, ASN Number' },
      { name: 'Whitelists', included: true, tooltip: 'Grant access from requests based on: IP Addresses' },
      { name: 'Web Loader', included: true, tooltip: 'Control your application from the web. This allows you to control your application from a web browser.' },
      { name: 'Logs (Discord Included)', included: true, tooltip: 'Send data/logs to your KeyAuth dashboard, or to your Discord Server.' },
      { name: '75mb File Upload', included: true, tooltip: 'Allow clients to download files that you upload. It\'s important to note that KeyAuth does not host files. We act as a proxy.' },
      { name: 'Custom Response Message', included: true, tooltip: 'Customize the response messages that are sent to the client when performing certain actions.' },
      { name: 'Hash Check', included: true, tooltip: 'Prevent users from using altered versions of your software.' },
      { name: 'Auto-Update', included: true, tooltip: 'Allow users to automatically update your software if the version is outdated.' },
      { name: 'Application Function Management', included: true, tooltip: 'Enable/Disable application functions without altering your application.' },
      { name: 'Audit Logs', included: true, tooltip: 'View logs of reseller actions.' },
      { name: 'Webhooks', included: true, tooltip: 'Send data between applications using HTTPS requests.' },
      { name: 'Reseller/Manager Accounts', included: true, tooltip: 'Resellers: Create licenses, Manage their users. Managers: Complete access control based on the permissions given' },
      { name: 'Chatrooms', included: true, tooltip: 'Allow users to communicate with each other.' },
      { name: 'Seller API Access', included: true, tooltip: 'Run all functions that are available on the Dashboard, via API anywhere you can make a request.' },
      { name: 'Discord Bot', included: true, tooltip: 'Run all functions that are available on the Dashboard, via API on the Discord Bot' },
      { name: 'Telegram Bot', included: true, tooltip: 'Run all functions that are available on the Dashboard, via API on the Telegram Bot' },
    ],
  }

  const pricing = {
    tester: { annual: '0', monthly: '0' },
    developer: { annual: '14.99', monthly: '2.99' },
    seller: { annual: '24.99', monthly: '4.99' },
  }

  const getPrice = (plan: 'tester' | 'developer' | 'seller') => {
    return isAnnual ? pricing[plan].annual : pricing[plan].monthly
  }

  const FeatureItem = ({ feature, plan }: { feature: typeof features.tester[0], plan: string }) => {
    const [showTooltip, setShowTooltip] = useState(false)
    
    return (
      <li className="flex items-start gap-2 text-sm text-white/90">
        {feature.included ? (
          <svg className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2Zm-1.999 14.413-3.713-3.705L7.7 11.292l2.299 2.295 5.294-5.294 1.414 1.414-6.706 6.706Z" />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2Zm4.207 12.793-1.414 1.414L12 13.414l-2.793 2.793-1.414-1.414L10.586 12 7.793 9.207l1.414-1.414L12 10.586l2.793-2.793 1.414 1.414L13.414 12l2.793 2.793Z" />
          </svg>
        )}
        <span className="flex-1">
          {feature.name}
          {feature.tooltip && (
            <span className="relative inline-block ml-1">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <Icon name="info" className="w-3.5 h-3.5 inline" />
              </button>
              {showTooltip && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 text-xs text-white bg-[#0f0f17] backdrop-blur-md rounded-xl shadow-xl border border-white/20 glass">
                  <p>{feature.tooltip}</p>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#0f0f17]" />
                </div>
              )}
            </span>
          )}
        </span>
      </li>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/70">
        <a href="/dashboard" className="hover:text-white transition">
          Dashboard
        </a>
        <span className="opacity-50">/</span>
        <span className="text-white">Upgrade</span>
      </div>

      {/* Header */}
      <div className="glass rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-red-400 flex items-center gap-2 mb-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              You don&apos;t have a subscription!
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mt-3">Upgrade</h1>
            <p className="text-sm text-white/60 mt-1">Upgrade your account today!</p>
          </div>
        </div>
      </div>

      {/* Alert Boxes */}
      <div className="space-y-4">
        <div className="glass rounded-2xl p-5 border border-red-500/30">
          <div className="flex items-start gap-3">
            <svg className="flex-shrink-0 w-5 h-5 text-red-400 mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 0 0 1 0-2h1v-3H8a1 0 0 1 0-2h2a1 0 0 1 1 1v4h1a1 0 0 1 0 2Z" />
            </svg>
            <div className="text-sm text-white/90">
              <span className="font-semibold text-red-400">Fraud Notice:</span> Committing fraud will result in your account being banned! There is also a risk rating on each payment. If it reaches a specific amount, we have the right to refund you and downgrade your account.
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-green-500/30">
          <div className="flex items-start gap-3">
            <svg className="flex-shrink-0 w-5 h-5 text-green-400 mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 0 0 1 0-2h1v-3H8a1 0 0 1 0-2h2a1 0 0 1 1 1v4h1a1 0 0 1 0 2Z" />
            </svg>
            <div className="text-sm text-white/90">
              <span className="font-semibold text-green-400">Discount:</span> If you currently have the Developer subscription (yearly only!), you can use code <span className="font-bold">alreadydev</span> to get 50% off when purchasing the seller subscription. Attempting to use the code while having the tester subscription will result in you only receiving the developer subscription.
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Toggle */}
      <div className="flex items-center justify-center">
        <div className="glass rounded-2xl p-4 border border-white/10">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAnnual}
              onChange={(e) => setIsAnnual(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 border-2 border-blue-500 bg-white/20 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
            <span className="ml-3 text-sm font-medium text-white">
              Annual pricing <span className="text-xs text-white/60">(save 50%+)</span>
            </span>
          </label>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tester Plan */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
          <div className="flex flex-col border-b border-white/10 pb-6 mb-6">
            <h3 className="font-bold text-2xl text-white mb-2">Tester</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-white/60">$</span>
              <span className="text-3xl font-bold text-white">{getPrice('tester')}</span>
              <span className="text-sm text-white/60">/{isAnnual ? 'Year' : 'Month'}</span>
            </div>
            <p className="text-sm text-white/60 mt-2">
              Limited Access for those looking to experiment implementing KeyAuth
            </p>
          </div>
          <ul className="mb-6 space-y-3 max-h-[500px] overflow-y-auto">
            {features.tester.map((feature, index) => (
              <FeatureItem key={index} feature={feature} plan="tester" />
            ))}
          </ul>
          <p className="text-sm font-medium text-white/60 text-center p-3 bg-[#0f0f17]/60 rounded-xl border border-white/10">
            This is the default subscription, and your current one.
          </p>
        </div>

        {/* Developer Plan */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-green-500/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex flex-col border-b border-white/10 pb-6 mb-6">
              <h3 className="font-bold text-2xl text-white mb-2">Developer</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-white/60">$</span>
                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500">{getPrice('developer')}</span>
                <span className="text-sm text-white/60">/{isAnnual ? 'Year' : 'Month'}</span>
              </div>
              <p className="text-sm text-white/60 mt-2">
                Ample limits plus full access to reseller system. Most folks start here.
              </p>
            </div>
            <ul className="mb-6 space-y-3 max-h-[500px] overflow-y-auto">
              {features.developer.map((feature, index) => (
                <FeatureItem key={index} feature={feature} plan="developer" />
              ))}
            </ul>
            <a
              href="https://discord.gg/b7XQpYeK2F"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-5 py-3 rounded-xl font-medium text-sm text-white bg-[#5865F2] hover:bg-[#4752C4] border border-[#5865F2]/50 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Buy With Discord
            </a>
            <div className="text-sm font-medium text-white/80 mt-4 text-center">
              Test with our <a href="/free-trial" target="_blank" className="hover:underline text-blue-400">trial accounts</a> before you buy!
            </div>
          </div>
        </div>

        {/* Seller Plan */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-cyan-500/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex flex-col border-b border-white/10 pb-6 mb-6">
              <h3 className="font-bold text-2xl text-white mb-2">Seller</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-white/60">$</span>
                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{getPrice('seller')}</span>
                <span className="text-sm text-white/60">/{isAnnual ? 'Year' : 'Month'}</span>
              </div>
              <p className="text-sm text-white/60 mt-2">
                Full-fledged supporter, we appreciate you for keeping our servers running!
              </p>
            </div>
            <ul className="mb-6 space-y-3 max-h-[500px] overflow-y-auto">
              {features.seller.map((feature, index) => (
                <FeatureItem key={index} feature={feature} plan="seller" />
              ))}
            </ul>
            <a
              href="https://discord.gg/b7XQpYeK2F"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-5 py-3 rounded-xl font-medium text-sm text-white bg-[#5865F2] hover:bg-[#4752C4] border border-[#5865F2]/50 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Buy With Discord
            </a>
            <div className="text-sm font-medium text-white/80 mt-4 text-center">
              Test with our <a href="/free-trial" target="_blank" className="hover:underline text-blue-400">trial accounts</a> before you buy!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

