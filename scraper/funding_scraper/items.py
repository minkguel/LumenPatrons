# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class FundingOpportunityItem(scrapy.Item):
    title = scrapy.Field()
    patron_name = scrapy.Field()
    description = scrapy.Field()
    category = scrapy.Field()
    minimum_amount = scrapy.Field()
    deadline = scrapy.Field()
    external_url = scrapy.Field()
