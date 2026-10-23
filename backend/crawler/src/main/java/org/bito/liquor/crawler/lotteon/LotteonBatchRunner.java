package org.bito.liquor.crawler.lotteon;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "lotteon.batch", havingValue = "true")
public class LotteonBatchRunner implements ApplicationRunner {
    private final LotteonCrawlService service;
    private final ConfigurableApplicationContext context;

    @Override
    public void run(ApplicationArguments args) {
        int count = service.scrapeLiquors().size();
        if (count <= 0) throw new IllegalStateException("롯데온 일일 저장 결과가 0건입니다.");
        log.info("LOTTEON_DAILY_SUCCESS updated={}", count);
        SpringApplication.exit(context, () -> 0);
    }
}
