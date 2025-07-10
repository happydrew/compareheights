// components/PricingPlans.jsx
import React, { useState, useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { RoughNotation } from "react-rough-notation";
import { CircularProgress } from '@mui/material';

const GET_ADS_AND_PACKAGES_URL = "https://api-autocommentai.randompokegen.cc/api/get-ads-and-packages";

interface Package {
    package_id: string;
    name: string;
    description: string;
    price: string;
    currency: string;
    credits: number;
    features: string[];
    popular: boolean;
    lang: string;
}

interface Ads {
    panelTopAds: string;
    panelBottomAds: string;
    pricingAds: string;
}

const backAdsAndPackages: { ads: Ads, packages: Package[] } = {
    ads: {
        panelTopAds: "",
        panelBottomAds: "",
        pricingAds: ""
    },
    packages: [
        {
            package_id: "start",
            name: "入门版",
            description: "适合初次体验和少量评论生成需求。",
            price: "9.9",
            currency: "CNY",// 货币符号, CNY, USD, HKD, etc.
            credits: 150,
            features: [
                "获得 150 积分",
                "大约可生成 150 次评论",
                "积分永久有效",
                "智能页面提取",
                "批量生成评论",
                "一键填充评论",
                "链接管理",
                "标准支持"
            ],
            popular: false,
            lang: "scmn"
        },
        {
            package_id: "standard",
            name: "标准版",
            description: "适合常规使用，满足大部分需求。",
            price: "19.9",
            currency: "CNY",// 货币符号, CNY, USD, HKD, etc.
            credits: 320,
            features: [
                "获得 300 积分 + 赠送 20 积分",
                "大约可生成 320 次评论",
                "积分永久有效",
                "智能页面提取",
                "批量生成评论",
                "一键填充评论",
                "链接管理",
                "标准支持"
            ],
            popular: false,
            lang: "scmn"
        },
        {
            package_id: "pro",
            name: "专业版",
            description: "适合重度用户，高性价比。",
            price: "59.9",
            currency: "CNY",
            credits: 1000,
            features: [
                "获得 900 积分 + 赠送 100 积分",
                "大约可生成 1000 次评论",
                "积分永久有效",
                "智能页面提取",
                "批量生成评论",
                "一键填充评论",
                "链接管理",
                "优先支持"
            ],
            popular: true,
            lang: "scmn"
        }
    ]
};

const backAdsAndPackages_eng: { ads: Ads, packages: Package[] } = {
    ads: {
        panelTopAds: "",
        panelBottomAds: "",
        pricingAds: ""
    },
    packages: [
        {
            package_id: "start_eng",
            name: "Starter",
            description: "Ideal for first-time users and light comment generation needs.",
            price: "5",
            currency: "USD",// 货币符号, CNY, USD, HKD, etc.
            credits: 250,
            features: [
                "Get 250 credits",
                "Generate about 250 comments",
                "Credits never expire",
                "Smart page extraction",
                "Bulk comments generation",
                "One-click fill comments",
                "Link management",
                "Standard support"
            ],
            popular: false,
            lang: "eng"
        },
        {
            package_id: "standard_eng",
            name: "Standard",
            description: "Suitable for most users, with a fair price.",
            price: "10",
            currency: "USD",// 货币符号, CNY, USD, HKD, etc.
            credits: 550,
            features: [
                "Get 500 credits + 50 credits",
                "Generate about 550 comments",
                "Credits never expire",
                "Smart page extraction",
                "Bulk comments generation",
                "One-click fill comments",
                "Link management",
                "Standard support"
            ],
            popular: false,
            lang: "eng"
        },
        {
            package_id: "pro_eng",
            name: "Profession",
            description: "Ideal for advanced users, with a premium price.",
            price: "30",
            currency: "USD",
            credits: 1800,
            features: [
                "Get 1500 credits + 300 credits",
                "Generate about 1800 comments",
                "Credits never expire",
                "Smart page extraction",
                "Bulk comments generation",
                "One-click fill comments",
                "Link management",
                "Priority support"
            ],
            popular: true,
            lang: "eng"
        }
    ]
};

// const packages = [
//     {
//         package_id: "start_eng",
//         name: "Starter",
//         description: "Perfect for casual users getting started with AI comments.",
//         price: "5",
//         currency: "USD",// 货币符号, CNY, USD, HKD, etc.
//         credits: 500,
//         features: [
//             "Get 500 credits",
//             "Generate about 500 comments",
//             "Credits never expire",
//             "Smart page extraction",
//             "Bulk comments generation",
//             "One-click fill comments",
//             "Link management",
//             "Standard support"
//         ],
//         popular: false,

//     },
//     {
//         package_id: "standard_eng",
//         name: "Standard",
//         description: "The best choice for regular users who engage frequently online.",
//         price: "10",
//         currency: "USD",// 货币符号, CNY, USD, HKD, etc.
//         credits: 1100,
//         features: [
//             "Get 1000 credits + 100 credits",
//             "Generate about 1100 comments",
//             "Credits never expire",
//             "Smart page extraction",
//             "Bulk comments generation",
//             "One-click fill comments",
//             "Link management",
//             "Standard support"
//         ],
//         popular: true,
//     },
//     {
//         package_id: "pro_eng",
//         name: "Professional",
//         description: "Best value for power users, marketers, and businesses.",
//         price: "30",
//         currency: "USD",
//         credits: 3500,
//         features: [
//             "Get 3000 credits + 500 credits",
//             "Generate about 3500 comments",
//             "Credits never expire",
//             "Smart page extraction",
//             "Bulk comments generation",
//             "One-click fill comments",
//             "Link management",
//             "Priority support"
//         ],
//         popular: false,
//     }
// ];

const PricingPlans = () => {

    const [isLoading, setIsLoading] = useState(false);

    const [adsAndPackages, setAdsAndPackages] = useState<{ ads: Ads, packages: Package[] }>({ ads: { panelTopAds: "", panelBottomAds: "", pricingAds: "" }, packages: [] });

    async function fetchAdsAndPackages(language: string = 'eng'): Promise<{ ads: Ads, packages: Package[] }> {
        try {
            const response = await fetch(`${GET_ADS_AND_PACKAGES_URL}?language=${language}`);
            if (response.ok) {
                const data = await response.json();
                console.log("background.ts fetchAdsAndPackages success, data: ", data);
                return data;
            } else {
                throw new Error("background.ts fetch getAdsAndPackages error: " + response.status + " " + response.statusText);
            }
        } catch (e) {
            console.error("background.ts getAdsAndPackages error: ", e);
            return language == 'scmn' ? backAdsAndPackages : backAdsAndPackages_eng;
        }
    }

    useEffect(() => {
        setIsLoading(true);
        fetchAdsAndPackages().then((data) => {
            setAdsAndPackages(data);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);



    return (
        <div className="w-full px-16 py-8">
            {isLoading && (
                <div
                    id="modal-overlay"
                    className="z-[999999] fixed top-0 left-0 w-full h-full bg-white flex items-center justify-center">
                    <CircularProgress sx={{ color: 'green' }} size={40} thickness={5} />
                </div>
            )}

            <div className="text-center space-y-4 mb-4">
                <h2 className="text-center text-white text-4xl sm:text-6xl font-sans font-bold tracking-tight">
                    <RoughNotation type="highlight" show={true} color="#2563EB">
                        Pricing
                    </RoughNotation>
                </h2>
                <p className="text-lg leading-7 text-[#71717a]">
                    Choose the perfect plan for your needs. All plans include our core features.
                </p>
            </div>

            {adsAndPackages?.ads?.pricingAds && (
                <div id="top-ads"
                    className="w-full h-[30px] text-[14px] bg-transparent text-amber-500 flex justify-center items-center overflow-hidden mb-4"
                >
                    <div id="top-ads-inner"
                        className="h-full flex justify-center items-center whitespace-nowrap hover:animate-autoFormAI-horizontalScroll"
                        dangerouslySetInnerHTML={{ __html: adsAndPackages.ads.pricingAds }}
                    />
                </div>
            )}

            <div className="w-full flex flex-col md:flex-row justify-center items-center gap-[6rem]">
                {adsAndPackages.packages.map((plan) => (
                    <PricingCard key={plan.package_id} {...plan} />
                ))}
            </div>
        </div>
    );
};

const PricingCard = ({
    name,
    description,
    price,
    currency,
    credits,
    features,
    popular
}) => {

    const handlePurchase = async () => {
        window.open("https://chromewebstore.google.com/detail/autocommentai/lnnbcbhcffnggkibgmhhjjgadjiainhd", '_blank');
    };

    return (
        <div className={`relative rounded-xl p-8 transition-all hover:shadow-xl dark:shadow-zinc-600 h-full max-w-[23rem] flex flex-col ${popular ? 'border-2 border-amber-500' : 'border-2 border-zinc-100 dark:border-zinc-800'}`}>

            {/* Popular Badge */}
            {popular && (
                <div className="absolute -top-3 right-4">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                        Most Popular
                    </div>
                </div>
            )}

            {/* Main content wrapper */}
            <div className="flex-1">
                {/* Header */}
                <div className="text-center space-y-2 mb-6 pt-4"> {/* 增加上边距，为badge腾出空间 */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-base">{description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center">
                        <span className="text-5xl font-bold text-gray-900 dark:text-gray-300">{currency === "CNY" ? "￥" : currency === "USD" ? "$" : currency === "HKD" ? "HK$" : currency}{price}</span>
                        <span className='text-gray-500 dark:text-gray-400 ml-1 text-lg'>/</span>
                        {/* {credits_before_discount &&
                            <span className='line-through text-gray-400 ml-1 text-sm'>{credits_before_discount}</span>
                        } */}
                        <span className='text-gray-500 dark:text-gray-400 ml-1 text-lg'> {credits} Credits</span>
                    </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-6">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                            <CheckCircleIcon
                                className="text-green-500 flex-shrink-0"
                                style={{ fontSize: '1.25rem' }}
                            />
                            <span className="text-gray-600 dark:text-gray-400 text-base">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* QR Code Purchase Section */}
            {/* <div className="mt-[8px] text-center"> 
                <h3 className="text-md font-semibold text-gray-700 mb-3">扫码添加微信购买</h3>
                <div className="inline-block p-2 bg-gray-50 rounded-lg shadow-md">
                    <img src={chrome.runtime.getURL('assets/weixin_qrcode.jpg')} alt="weixin QR Code" className="w-24 h-24" />
                </div>
            </div> */}

            <div className="mt-4 text-center">
                <button
                    className={`w-full text-[16px] p-[8px] text-white rounded-[6px] bg-amber-600 hover:bg-amber-700 transition font-medium`}
                    onClick={handlePurchase}
                >
                    <div className="flex items-center justify-center">
                        Get Started
                    </div>
                </button>
            </div>
        </div>
    );
};

export default PricingPlans;