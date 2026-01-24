"use client"

import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GuestNavbar } from "@/components/guest-navbar"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ArrowRight, Gift, Heart, Users, Zap, TrendingUp, Crown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { mockUsers, mockPosts } from "@/lib/mock-data"

export default function LandingPage() {
  const { user } = useApp()
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    if (user) {
      router.push("/feed")
    }
  }, [user, router])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (user) {
    return null
  }

  // Get top givers (users with highest followers)
  const topGivers = mockUsers.slice(0, 3).sort((a, b) => b.followersCount - a.followersCount)

  // Get trending giveaways
  const trendingGiveaways = mockPosts.filter((p) => p.type === "giveaway").slice(0, 3)

  // Get trending requests
  const trendingRequests = mockPosts.filter((p) => p.type === "help-request").slice(0, 3)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <GuestNavbar />

      {/* Hero Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden ">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-96 h-96 bg-orange-100 dark:bg-orange-900 rounded-full blur-3xl opacity-20"
            style={{ transform: `translateY(${scrollY * 0.5}px)` }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge className="inline-flex mb-6 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-0">
            <Zap className="w-3 h-3 mr-1" />
            Community Powered Platform
          </Badge>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Give Back, Get Help, Build Together
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
            Join a community of generous givers and builders. Create giveaways, request help, earn badges, and make a
            real impact.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto">
                Start Giving Today
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How Geev Works</h2>
            <p className="text-gray-600 dark:text-gray-300">Three simple ways to make a difference</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Giveaways</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Share your success by creating giveaways for your community. Set prizes, requirements, and watch people
                engage.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Request Help</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Need support for a project or personal goal? Create a help request and let the community rally behind
                you.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Build Community</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect with like-minded people, earn badges, climb rankings, and be part of something bigger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Givers Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-6 h-6 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Top Givers</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Meet the community members making the biggest impact</p>

          <div className="grid md:grid-cols-3 gap-6">
            {topGivers.map((giver, idx) => (
              <Link key={giver.id} href={`/profile/${giver.id}`}>
                <div className="bg-white dark:bg-slate-800 h-full p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-orange-600">
                      <AvatarImage src={giver.avatar || "/placeholder.svg"} alt={giver.name} />
                      <AvatarFallback>
                        {giver.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                          {giver.name}
                        </h3>
                        {giver.isVerified && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">@{giver.username}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="font-bold text-orange-600">{giver.postsCount}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Posts</div>
                    </div>
                    <div>
                      <div className="font-bold text-orange-600">{(giver.followersCount / 1000).toFixed(1)}K</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Followers</div>
                    </div>
                    <div>
                      <div className="font-bold text-orange-600">{giver.badges?.length || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Badges</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Giveaways & Requests */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Trending Giveaways</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Popular giveaways happening right now</p>

            <div className="grid md:grid-cols-3 gap-6">
              {trendingGiveaways.map((post) => (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-orange-500 dark:hover:border-orange-500 transition-colors cursor-pointer">
                    <div
                      className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center bg-cover"
                      style={{ backgroundImage: `url(${post.media?.[0].url})` }}
                    >
                      <Gift className="w-12 h-12 text-orange-600 opacity-50" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{post.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
                          {post.entriesCount || 0} Entries
                        </Badge>
                        <div className="text-sm font-bold text-orange-600">{post.likesCount || 0} 🔥</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-12">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-red-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Help Requests</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Community members asking for support</p>

            <div className="grid md:grid-cols-3 gap-6">
              {trendingRequests.map((post) => (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-orange-500 dark:hover:border-orange-500 transition-colors cursor-pointer">
                    <div
                      className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center bg-cover"
                      style={{ backgroundImage: `url(${post.media?.[0].url})` }}
                    >
                      <Heart className="w-12 h-12 text-red-600 opacity-50" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{post.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0">
                          {post.entriesCount || 0} Responses
                        </Badge>
                        <div className="text-sm font-bold text-orange-600">{post.likesCount || 0} 🔥</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">2.5K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">$50K+</div>
              <div className="text-gray-600 dark:text-gray-300">Given Away</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">1.2K+</div>
              <div className="text-gray-600 dark:text-gray-300">Giveaways</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">800+</div>
              <div className="text-gray-600 dark:text-gray-300">People Helped</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of givers and builders. Start your journey today.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8">
              Create Your Account
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo-light.png" alt="Geev" className="h-10 dark:hidden" />
                <img src="/logo-dark.png" alt="Geev" className="h-10 hidden dark:block" />
                {/* <span className="font-bold text-lg text-gray-900 dark:text-white">Geev</span> */}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Building stronger communities through social giving and web3 technology.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/feed" className="hover:text-orange-600 transition-colors">
                    Browse Giveaways
                  </Link>
                </li>
                <li>
                  <Link href="/feed" className="hover:text-orange-600 transition-colors">
                    Find Help Requests
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-orange-600 transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">© 2026 Geev. All rights reserved.</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Built with ❤️ for the community, by the community
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
