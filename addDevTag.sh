# GET Current Commit Hash -------
if [ $# -eq 0 ]
then
    commit_hash=`git log --pretty=format:'%H' -n 1`
else
    commit_hash=$1
fi

# check if current commit already has a tag or not------------
if [[ `git tag -l --points-at $commit_hash` == "" ]]
then
    continue=1
else
    RED='\033[0;31m'
    NC='\033[0m'
    printf "${RED}This commit already has a tag. Please remove that and re-run this script${NC}\n"
    echo "git tag --delete <tagName>"
    echo "git push --delete origin <tagName>"
    exit 1
fi

# get version------------
version=`cat package.json | grep -e '"version":'`

while IFS='"' read -ra ADDR; do
    counter=0
    for i in "${ADDR[@]}"; do
        if [ $counter == 3 ]
        then
            version=$i
        fi
        counter=$(($counter+1))
    done
done <<< "$version"

git tag dev-v$version $commit_hash
git push --tags