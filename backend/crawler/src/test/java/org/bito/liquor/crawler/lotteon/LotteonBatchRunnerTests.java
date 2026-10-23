package org.bito.liquor.crawler.lotteon;

import org.bito.liquor.common.model.LiquorPrice;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.context.ConfigurableApplicationContext;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LotteonBatchRunnerTests {
    @Test
    void successfulBatchClosesTheApplication() {
        var service = mock(LotteonCrawlService.class);
        var context = mock(ConfigurableApplicationContext.class);
        when(service.scrapeLiquors()).thenReturn(List.of(new LiquorPrice()));
        new LotteonBatchRunner(service, context).run(new DefaultApplicationArguments());
        verify(context).close();
    }

    @Test
    void zeroWritesAreNotReportedAsSuccessful() {
        var service = mock(LotteonCrawlService.class);
        var context = mock(ConfigurableApplicationContext.class);
        when(service.scrapeLiquors()).thenReturn(List.of());
        assertThrows(IllegalStateException.class, () -> new LotteonBatchRunner(service, context).run(new DefaultApplicationArguments()));
        verify(context, never()).close();
    }

    @Test
    void databaseOrCrawlerFailurePropagatesToApplicationStartup() {
        var service = mock(LotteonCrawlService.class);
        var context = mock(ConfigurableApplicationContext.class);
        when(service.scrapeLiquors()).thenThrow(new IllegalStateException("simulated database failure"));
        assertThrows(IllegalStateException.class, () -> new LotteonBatchRunner(service, context).run(new DefaultApplicationArguments()));
        verify(context, never()).close();
    }
}
