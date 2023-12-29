class Solution {
public:
    int findPeakElement(vector<int>& nums) {
        if(nums.size()>2)
            {
        for(int i=0;i<nums.size();i++)
        {
            
                if(nums[i]>nums[i+1]&&nums[i]>nums[i-1])
                {
                    return i;
                }
            
        }
        }
            else if(nums.size()==2)
            {
                return nums[0]>nums[1]?0:1;
            }

        return 0;
    }
};