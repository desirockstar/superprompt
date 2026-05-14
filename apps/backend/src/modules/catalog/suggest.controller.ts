import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SuggestService, SuggestResult } from './suggest.service';

@ApiTags('Suggest')
@Controller('suggest')
export class SuggestController {
  constructor(private readonly suggestService: SuggestService) {}

  @Get()
  @ApiOperation({
    summary: 'Auto-suggest for search',
    description: `Returns filtered suggestions for categories, tags, and other filterable types.

**Query parameters:**
- \`q\` — Search query (required, min 1 char)
- \`types\` — Comma-separated list of suggester keys (e.g. \`categories,tags\`). Omit to get all.
- \`limit\` — Max results per type (default: 10)

**Extensible:** New types can be added by implementing the \`Suggester<T>\` interface and registering in \`SuggestService\`.
Available types: \`categories\`, \`tags\` (more coming: \`output-types\`, \`applications\`, etc.)

**Response shape:**
\`\`\`json
{
  "categories": [{ "name": "Goal Setting", "slug": "goal-setting" }],
  "tags": [{ "name": "goal-setting", "slug": "goal-setting" }]
}
\`\`\`
`,
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 1 character)', type: String })
  @ApiQuery({ name: 'types', required: false, description: 'Comma-separated suggester keys (e.g. categories,tags)', type: String })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results per type', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Suggestions returned successfully',
    schema: {
      example: {
        categories: [{ name: 'Goal Setting', slug: 'goal-setting' }],
        tags: [{ name: 'goal-setting', slug: 'goal-setting' }],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Query parameter "q" is required and must be at least 1 character' })
  async suggest(
    @Query('q') query?: string,
    @Query('types') types?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query || query.trim().length < 1) {
      throw new NotFoundException('Query parameter "q" is required and must be at least 1 character');
    }

    const parsedTypes = types
      ? types.split(',').map(t => t.trim()).filter(Boolean)
      : undefined;

    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 50) : 10;

    return this.suggestService.suggest(query.trim(), parsedTypes, parsedLimit);
  }
}