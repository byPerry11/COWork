"use client"

import Link from "next/link"

export function LandingFooter() {
    return (
        <footer className="relative z-10 mt-20 border-t border-white/10 bg-black py-12 text-center md:text-left text-white">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <div className="h-8 w-8 overflow-hidden rounded-lg border border-white/10">
                                <img src="/cowork-logo-dark.png" alt="Logo" className="h-full w-full object-cover" />
                            </div>
                            <span className="text-lg font-bold tracking-wider text-white">COWork</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            Empowering teams to build the future. <br /> Simple, fast, and elegant.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold text-white">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold text-white">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold text-white">Legal</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between border-t border-white/5 pt-8 md:flex-row text-xs text-gray-600">
                    <p>&copy; {new Date().getFullYear()} COWork Inc. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                        <a href="#" className="hover:text-white transition-colors">GitHub</a>
                        <a href="#" className="hover:text-white transition-colors">Discord</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
