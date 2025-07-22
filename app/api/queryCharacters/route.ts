import { supabaseAdmin, TABLES } from '@lib/supabase_service';
import { NextRequest, NextResponse } from 'next/server';
import { CharacterType, type Character } from '@lib/characters';
import { DatabaseCharacter } from '@lib/types';

// 数据库记录转换为前端格式
function transformDatabaseToFrontend(dbRecord: DatabaseCharacter): Character {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    height: dbRecord.height,
    type: dbRecord.type as CharacterType,
    mediaType: dbRecord.media_type,
    mediaUrl: dbRecord.media_url,
    thumbnailUrl: dbRecord.thumbnail_url,
    svgContent: null, // SVG内容不存储在数据库中，需要时动态获取
    color: dbRecord.color,
    colorCustomizable: dbRecord.color_customizable,
    colorProperty: dbRecord.color_property || undefined,
    createdAt: dbRecord.created_at
  };
}

export async function GET(request: NextRequest) {
  try {
    // 获取客户端IP
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    console.log(`queryCharacters request ip: ${clientIp}`);

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log(`queryCharacters params: type=${type}, search=${search}, limit=${limit}, offset=${offset}`);

    // 构建查询
    let query = supabaseAdmin
      .from(TABLES.CHARACTERS)
      .select('*')

    // 按类型过滤
    if (type !== 'all') {
      query = query.eq('type', type);
    }

    // 按搜索词过滤 (名称)
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // 添加排序和分页
    query = query
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    // 执行查询
    const { data: charactersData, error: charactersError, count } = await query;

    if (charactersError) {
      console.error('Query characters error:', charactersError);
      throw charactersError;
    }

    if (!charactersData) {
      console.log('No characters data found');
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: '未找到角色'
      }, { status: 200 });
    }

    // 转换数据格式
    const characters: Character[] = charactersData.map(transformDatabaseToFrontend);

    // 获取总数（如果需要分页信息）
    let totalCount = count || charactersData.length;
    if (offset === 0 && charactersData.length < limit) {
      // 如果是第一页且返回数据少于限制，则总数就是返回的数量
      totalCount = charactersData.length;
    } else {
      // 否则需要单独查询总数
      let countQuery = supabaseAdmin
        .from(TABLES.CHARACTERS)
        .select('*', { count: 'exact', head: true })

      if (type !== 'all') {
        countQuery = countQuery.eq('type', type);
      }
      if (search) {
        countQuery = countQuery.ilike('name', `%${search}%`);
      }

      const { count: exactCount } = await countQuery;
      totalCount = exactCount || 0;
    }

    console.log(`queryCharacters result: found ${characters.length} characters, total: ${totalCount}`);

    return NextResponse.json({
      success: true,
      data: characters,
      total: totalCount,
      message: '角色检索成功'
    }, { status: 200 });

  } catch (error) {
    console.error('queryCharacters error:', error);
    return NextResponse.json({
      success: false,
      error: '查询角色失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}