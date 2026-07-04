import json
from pathlib import Path

import scrapy

from funding_scraper.items import FundingOpportunityItem


class InnovationsfondenSpider(scrapy.Spider):
    name = "innovationsfonden"
    allowed_domains = ["innovationsfonden.dk"]

    async def start(self):
        sources_path = Path(__file__).resolve().parents[2] / "SourceUrls.json"
        with open(sources_path, "r", encoding="utf-8") as f:
            sources = json.load(f)

        for source in sources:
            if source["domain"] == "innovationsfonden.dk":
                yield scrapy.Request(
                    url=source["start_url"],
                    callback=self.parse_programmes_list,
                    meta={"category": source["category"]},
                )

    def parse_programmes_list(self, response):
        links = response.css("a[href^='/en/p/']::attr(href)").getall()
        for href in links:
            yield response.follow(
                href,
                callback=self.parse_programme,
                meta={"category": response.meta["category"]},
            )

    def parse_programme(self, response):
        item = FundingOpportunityItem()

        item["title"] = "".join(response.css("h1 *::text").getall()).strip()
        item["patron_name"] = "Innovation Fund Denmark"
        item["category"] = response.meta["category"]
        item["external_url"] = response.url
        item["description"] = (
            response.css(".field--name-field-intro p::text").get(default="").strip()
        )

        programme_path = response.url.replace("https://innovationsfonden.dk", "")
        sub_links = response.css(f"a[href^='{programme_path}/']::attr(href)").getall()

        if sub_links:
            for href in sub_links:
                yield response.follow(
                    href, callback=self.parse_round, meta=response.meta
                )
            return

        item["deadline"] = ""
        item["minimum_amount"] = ""

        yield item

    def parse_round(self, response):
        item = FundingOpportunityItem()

        item["title"] = "".join(response.css("h1 *::text").getall()).strip()
        item["patron_name"] = "Innovation Fund Denmark"
        item["category"] = response.meta["category"]
        item["external_url"] = response.url
        item["description"] = (
            response.css("p.apply-page--intro::text").get(default="").strip()
        )
        item["deadline"] = (
            response.css("div.field--name-field-deadline-text::text")
            .get(default="")
            .strip()
        )
        item["minimum_amount"] = (
            response.xpath(
                '//p[@class="apply-page--teaser--header" and text()="How much?"]/following-sibling::p[@class="apply-page--teaser--body"]/text()'
            )
            .get(default="")
            .strip()
        )

        yield item
