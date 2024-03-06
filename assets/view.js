window.onload = () => {
    $('audio').initAudioPlayer({onTimeUpdate: syncAudioTextProcess});

    if (currentChapter > 1) {
        document.querySelector('#previousChapterButton').onclick = () => window.location.href = `../chapter-${currentChapter-1}/index.html`;
    }

    if (currentChapter < totalChapter) {
        document.querySelector('#nextChapterButton').onclick = () => window.location.href = `../chapter-${currentChapter+1}/index.html`;
    }
    
};

function syncAudioTextProcess(currentTime) {
    const index = binarySearch(audioInfo.time_list, currentTime);

    $('.text-left.p-active').removeClass('p-active');
    $(`.text-left:nth-child(${index})`).addClass('p-active');
}

function binarySearch(arr, val) {
    let start = 0;
    let end = arr.length - 1;
  
    while (start <= end) {
      let mid = Math.floor((start + end) / 2);
  
      if (arr[mid] === val) {
        return mid;
      }
  
      if (val < arr[mid]) {
        end = mid - 1;
      } else {
        start = mid + 1;
      }
    }
    return start;
  }