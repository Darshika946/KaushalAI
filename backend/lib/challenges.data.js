export const SEED_DSA_PROBLEMS = [
  {
    slug: "two-sum-target",
    title: "Two Sum Target",
    difficulty: "Easy",
    category: "Arrays & Hash Maps",
    problemStatement:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Return the indices sorted in ascending order.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "Because nums[0] + nums[1] == 2 + 7 == 9, we return [0, 1].",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
        explanation: "Because nums[1] + nums[2] == 2 + 4 == 6, we return [1, 2].",
      },
    ],
    starterCode: {
      python: `def two_sum(nums, target):
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test execution runner
import json, sys
if __name__ == '__main__':
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        target = int(lines[1])
        print(json.dumps(two_sum(nums, target)))
`,
      javascript: `function twoSum(nums, target) {
  // Write your solution here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test execution runner
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
  const nums = JSON.parse(input[0]);
  const target = parseInt(input[1], 10);
  console.log(JSON.stringify(twoSum(nums, target)));
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
#include <string>
#include <sstream>

std::vector<int> twoSum(std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.find(complement) != seen.end()) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    std::string line;
    if (std::getline(std::cin, line)) {
        std::vector<int> nums;
        std::stringstream ss(line);
        char ch;
        int val;
        while (ss >> ch) {
            if (ch == '[' || ch == ',') {
                if (ss >> val) nums.push_back(val);
            }
        }
        int target;
        if (std::cin >> target) {
            auto ans = twoSum(nums, target);
            std::cout << "[" << ans[0] << ", " << ans[1] << "]" << std::endl;
        }
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLine()) {
            String line = sc.nextLine().replaceAll("[\\[\\]]", "");
            String[] parts = line.split(",");
            int[] nums = new int[parts.length];
            for (int i = 0; i < parts.length; i++) {
                nums[i] = Integer.parseInt(parts[i].trim());
            }
            int target = sc.nextInt();
            int[] res = twoSum(nums, target);
            System.out.println("[" + res[0] + ", " + res[1] + "]");
        }
    }
}
`,
    },
    testCases: [
      {
        input: "[2, 7, 11, 15]\n9",
        expectedOutput: "[0, 1]",
        isHidden: false,
      },
      {
        input: "[3, 2, 4]\n6",
        expectedOutput: "[1, 2]",
        isHidden: false,
      },
      {
        input: "[3, 3]\n6",
        expectedOutput: "[0, 1]",
        isHidden: true,
      },
      {
        input: "[1, 5, 7, 12, 19]\n20",
        expectedOutput: "[0, 4]",
        isHidden: true,
      },
    ],
    hints: [
      "Can we do better than brute force O(n^2)?",
      "Think about using a hash map to remember numbers we have seen so far.",
      "For each element x, compute (target - x) and check if it already exists in your hash map.",
    ],
  },
  {
    slug: "longest-substring-without-repeating",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "Sliding Window & Two Pointers",
    problemStatement:
      "Given a string s, find the length of the longest substring without repeating characters. A substring is a contiguous non-empty sequence of characters within a string.",
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces.",
    ],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: "1",
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: "3",
        explanation: 'The answer is "wke", with the length of 3.',
      },
    ],
    starterCode: {
      python: `def length_of_longest_substring(s: str) -> int:
    char_map = {}
    left = 0
    max_len = 0
    for right, ch in enumerate(s):
        if ch in char_map and char_map[ch] >= left:
            left = char_map[ch] + 1
        char_map[ch] = right
        max_len = max(max_len, right - left + 1)
    return max_len

import sys
if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw.startswith('"') and raw.endswith('"'):
        raw = raw[1:-1]
    print(length_of_longest_substring(raw))
`,
      javascript: `function lengthOfLongestSubstring(s) {
  const map = new Map();
  let left = 0;
  let maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (map.has(ch) && map.get(ch) >= left) {
      left = map.get(ch) + 1;
    }
    map.set(ch, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}

const fs = require('fs');
let input = fs.readFileSync(0, 'utf-8').trim();
if (input.startsWith('"') && input.endsWith('"')) {
  input = input.slice(1, -1);
}
console.log(lengthOfLongestSubstring(input));
`,
      cpp: `#include <iostream>
#include <string>
#include <unordered_map>
#include <algorithm>

int lengthOfLongestSubstring(const std::string& s) {
    std::unordered_map<char, int> map;
    int left = 0, maxLen = 0;
    for (int right = 0; right < s.size(); right++) {
        char ch = s[right];
        if (map.find(ch) != map.end() && map[ch] >= left) {
            left = map[ch] + 1;
        }
        map[ch] = right;
        maxLen = std::max(maxLen, right - left + 1);
    }
    return maxLen;
}

int main() {
    std::string s;
    std::getline(std::cin, s);
    if (!s.empty() && s.front() == '"' && s.back() == '"') {
        s = s.substr(1, s.size() - 2);
    }
    std::cout << lengthOfLongestSubstring(s) << std::endl;
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> map = new HashMap<>();
        int left = 0, maxLen = 0;
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            if (map.containsKey(ch) && map.get(ch) >= left) {
                left = map.get(ch) + 1;
            }
            map.put(ch, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine().trim() : "";
        if (s.startsWith("\"") && s.endsWith("\"")) {
            s = s.substring(1, s.length() - 1);
        }
        System.out.println(lengthOfLongestSubstring(s));
    }
}
`,
    },
    testCases: [
      {
        input: "abcabcbb",
        expectedOutput: "3",
        isHidden: false,
      },
      {
        input: "bbbbb",
        expectedOutput: "1",
        isHidden: false,
      },
      {
        input: "pwwkew",
        expectedOutput: "3",
        isHidden: true,
      },
      {
        input: "tmmzuxt",
        expectedOutput: "5",
        isHidden: true,
      },
    ],
    hints: [
      "Use a sliding window approach with two pointers (left and right).",
      "Store the most recent index of each character in a map or lookup table.",
      "When a duplicate is encountered, slide the left pointer past the previous index of that duplicate.",
    ],
  },
];

export const SEED_TECH_ARTICLES = [
  {
    slug: "distributed-caching-redis-cdns",
    title: "Distributed Caching & Invalidation Patterns: Redis and Edge CDNs",
    category: "System Design",
    author: "KaushalAI System Design Team",
    readTimeMinutes: 4,
    sourceUrl: "https://systemdesignprimer.org/distributed-caching",
    summary3Min:
      "Distributed caching drastically reduces database pressure and latency by serving hot read requests from fast in-memory stores. This article breaks down Cache-Aside vs Write-Through strategies, race conditions during cache stampedes, and deterministic TTL expiration alongside Event-Driven Invalidation via Redis Pub/Sub.",
    keyTakeaways: [
      "Cache-Aside (Lazy Loading) keeps the cache resilient against failures because downstream databases remain the single source of truth.",
      "Thundering Herd (Cache Stampede) can be mitigated using Mutex locking or Probabilistic Early Expiration (XFetch algorithm).",
      "Multi-region edge invalidation requires decoupled event brokers like Kafka or Redis streams rather than synchronous webhook chains.",
      "Always set jittered TTLs to prevent synchronized cache evictions across millions of keys.",
    ],
    fullText: `Distributed caching is the cornerstone of scalable web architectures.

1. Cache Topology & Hierarchy
In modern tier-1 web services, caching exists at two primary layers:
- Edge Cache (Cloudflare, AWS CloudFront) for static assets and public API query responses.
- Application Layer Cache (Redis Clusters, Memcached) for database entity caching and session tokens.

2. Critical Invalidation Patterns
There are two hard problems in computer science: cache invalidation and naming things.
- Cache-Aside: Application reads from cache. On miss, it reads from database and hydrates cache.
- Write-Through: Application writes to cache, cache synchronously writes to database.
- Write-Behind (Write-Back): Cache acknowledges write immediately, asynchronously batches persistence to the database.

3. Tackling Cache Stampedes
When a popular cache key expires, thousands of concurrent requests can simultaneously hit the database. Solutions include distributed locks (Redlock) or background revalidation where keys are refreshed when 80% of their TTL has elapsed.`,
  },
  {
    slug: "zero-downtime-deployments",
    title: "Zero-Downtime Deployments: Blue-Green, Canary & Database Migrations",
    category: "DevOps & Cloud",
    author: "KaushalAI Cloud & SRE Track",
    readTimeMinutes: 4,
    sourceUrl: "https://12factor.net/devops-continuous-delivery",
    summary3Min:
      "Deploying high-availability production services without losing active customer traffic requires sophisticated traffic orchestration and backward-compatible schema migration strategies. Learn how Blue-Green and Canary deployments insulate production services from regression downtime.",
    keyTakeaways: [
      "Blue-Green environments allow instant traffic cutovers with zero downtime via load balancer target group redirection.",
      "Canary deployments route 2% to 10% of real user traffic to the new revision to monitor error rates before 100% rollout.",
      "Database schema changes MUST follow the Expand and Contract pattern across separate release cycles.",
      "Graceful SIGTERM shutdown handling ensures ongoing HTTP requests and database transactions complete before pods terminate.",
    ],
    fullText: `Continuous deployment is incomplete without robust rollback and progressive delivery mechanisms.

1. Blue-Green Deployment Architecture
Two identical production environments exist: Blue (active) and Green (idle staging). When Green is deployed and health checks pass, the reverse proxy or router switches upstream targets in milliseconds.

2. Canary Releases
Rather than an all-or-nothing cutover, traffic is routed proportionally using service meshes (Istio) or Ingress controllers. Real-time telemetry evaluates p99 latency and 5xx error rates against statistical baselines.

3. The Expand-Contract Database Pattern
Database migrations must never introduce breaking changes simultaneously with code deployments.
- Phase 1 (Expand): Add nullable column or duplicate column.
- Phase 2 (Deploy): Update code to read from new column, write to both.
- Phase 3 (Contract): Backfill historical data and drop old deprecated column in a separate subsequent release.`,
  },
];

export const SEED_WEEKLY_PROJECTS = [
  {
    slug: "auth-rate-limiting-microservice",
    weekNumber: 1,
    title: "Production Auth & Rate Limiting Microservice",
    domain: "Backend Microservices & Security",
    overview:
      "Design and build an enterprise-grade Authentication and Distributed Rate Limiting microservice. Your service must implement secure token rotation, distributed sliding-window rate limiting with Redis, and robust input validation.",
    architectureRequirements: [
      "Decoupled microservice architecture with Express/Node, FastAPI/Python, or Go.",
      "JWT access tokens (15m expiry) paired with cryptographic refresh tokens (7d expiry) stored in Redis or database.",
      "Distributed Rate Limiter implementing Token Bucket or Sliding Window Log (e.g. 60 requests/minute per IP/API Key).",
      "Structured JSON logging with request correlation IDs and standardized error envelope formatting.",
      "Comprehensive test suite covering authentication barriers and rate-limit threshold exhaustion.",
    ],
    acceptedTechStacks: [
      "Node.js / Express or Fastify with TypeScript or JavaScript",
      "Python / FastAPI or Django REST Framework",
      "Go / Gin or Fiber",
      "Java / Spring Boot",
    ],
    apiEndpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/register",
        description: "Registers user, hashes password with bcrypt/argon2, returns status.",
      },
      {
        method: "POST",
        path: "/api/v1/auth/login",
        description: "Validates credentials, returns JWT accessToken and sets HTTP-only refreshToken cookie.",
      },
      {
        method: "POST",
        path: "/api/v1/auth/refresh",
        description: "Validates refresh token, invalidates old token, and issues a fresh token pair.",
      },
      {
        method: "GET",
        path: "/api/v1/protected/data",
        description: "Guarded endpoint subject to rate limiting with X-RateLimit headers.",
      },
    ],
    gradingRubric: [
      {
        criteria: "Architecture & Code Organization",
        maxScore: 10,
        description: "Clean separation of controllers, services, repositories, and middleware. Modularity and layer decoupling.",
      },
      {
        criteria: "Code Cleanliness, Readability & Patterns",
        maxScore: 10,
        description: "Meaningful naming, SOLID principles, idiomatic language patterns, absence of hardcoded magic values.",
      },
      {
        criteria: "Error Handling & Edge Case Coverage",
        maxScore: 10,
        description: "Strict input validation, defensive error handling, token expiration edge cases, and rate-limit HTTP 429 response handling.",
      },
    ],
    learningTrack: {
      playlistTitle: "Microservices Architecture & Distributed System Fundamentals",
      playlistUrl: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9g6m_6S079E13222e960309",
      embedUrl: "https://www.youtube.com/embed/videoseries?list=PL4cUxeGkcC9g6m_6S079E13222e960309",
      modules: [
        {
          id: "mod-1",
          title: "Module 1: Principles of Microservices & Domain-Driven Design",
          duration: "45 mins",
          videoUrl: "https://www.youtube.com/watch?v=1xo-0gCVhTU",
        },
        {
          id: "mod-2",
          title: "Module 2: JWT Security Best Practices & Token Rotation",
          duration: "52 mins",
          videoUrl: "https://www.youtube.com/watch?v=mbsmsi7l3r4",
        },
        {
          id: "mod-3",
          title: "Module 3: Implementing Distributed Rate Limiting with Redis",
          duration: "38 mins",
          videoUrl: "https://www.youtube.com/watch?v=CRgp4z0Xp2s",
        },
        {
          id: "mod-4",
          title: "Module 4: Writing Automated Integration & Load Tests",
          duration: "40 mins",
          videoUrl: "https://www.youtube.com/watch?v=zJg5n7X_w3Y",
        },
      ],
    },
  },
];
