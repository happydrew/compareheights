import { supabaseAdmin } from '@/lib/supabase_service';
import { NextRequest, NextResponse } from 'next/server';
import { type Ads, type Package } from '@/lib/constants';

export async function GET(request: NextRequest) {
    //return NextResponse.json({ success: false, error: 'test' }, { status: 400 });

    try {
        // 获取客户端IP
        const forwardedFor = request.headers.get("x-forwarded-for");
        const clientIp = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
        console.log(`request ip: ${clientIp}`);

        const { searchParams } = new URL(request.url);
        let language = searchParams.get('language') || 'scmn';

        const { data: adsData, error: adsError } = await supabaseAdmin
            .from('ads')
            .select('*')
            .eq('lang', language)
            .limit(1);
        if (adsError) {
            throw adsError;
        }

        let ads: Ads = {
            panelTopAds: '',
            panelBottomAds: '',
            pricingAds: ''
        };
        if (adsData) {
            ads.panelTopAds = adsData[0].panel_top_ads;
            ads.panelBottomAds = adsData[0].panel_bottom_ads;
            ads.pricingAds = adsData[0].pricing_ads;
        }

        const { data: packagesData, error: packagesError } = await supabaseAdmin
            .from('packages')
            .select('*')
            .eq('is_active', true)
            .eq('is_show', true)
            .eq('lang', language)
            .order('price', { ascending: true });
        if (packagesError) {
            throw packagesError;
        }

        if (!packagesData || packagesData.length === 0) {
            throw new Error('No packages data found');
        }

        const packages: Package[] = [];
        packagesData.forEach((packageData) => {
            packages.push({
                package_id: packageData.package_id,
                name: packageData.name,
                description: packageData.description,
                price: packageData.price,
                currency: packageData.currency,
                credits: packageData.credits,
                features: JSON.parse(packageData.features),
                popular: packageData.popular,
                lang: packageData.lang
            });
        });
        console.log(`ads and packages: ${JSON.stringify({ ads, packages })}`);
        return NextResponse.json({ ads, packages }, { status: 200 });
    } catch (e) {
        console.error('get ads and packages error: ', e);
        return NextResponse.json({ success: false, error: 'get ads and packages error' }, { status: 500 });
    }
} 